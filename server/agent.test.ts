import assert from "node:assert/strict";
import { mkdtempDisposable, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import OpenAI from "openai";
import type { ChatMessage } from "../shared/chat.ts";
import { createTaskReply } from "./agent.ts";
import { createJsonTaskStore } from "./task-store.ts";

async function openTestStore(t: TestContext) {
  const directory = await mkdtempDisposable(join(tmpdir(), "todo-agent-chat-"));
  t.after(() => directory.remove());
  const filename = join(directory.path, "tasks.json");
  return { filename, tasks: createJsonTaskStore(filename) };
}

function toolCall(name: string, args: object) {
  return {
    id: "call_test",
    type: "function",
    function: { name, arguments: JSON.stringify(args) },
  };
}

function getMockClient(choose: (messages: ChatMessage[]) => ReturnType<typeof toolCall>[]) {
  const client = new OpenAI({
    apiKey: "test-only",
    maxRetries: 0,
    async fetch(_url, init) {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.reasoning_effort, "none");
      assert.equal(body.tool_choice, "required");
      assert.deepEqual(
        body.tools.map((tool: { function: { name: string } }) => tool.function.name),
        ["create_task", "list_tasks", "clarify", "complete_task", "delete_task"],
      );
      const toolCalls = choose(body.messages);
      return Response.json({ choices: [{ message: { tool_calls: toolCalls } }] });
    },
  });
  return () => client;
}

test("官方六轮对话逐步更新清单，重新打开存储后仍可查询", async (t) => {
  const { filename, tasks } = await openTestStore(t);
  const milk = ["买牛奶", false];
  const delivery = ["取快递", false];
  const completedMilk = ["买牛奶", true];
  const scenarios = [
    {
      message: "帮我记一下买牛奶",
      call: toolCall("create_task", { title: "买牛奶" }),
      answer: "已添加「买牛奶」（待办）。",
      state: [milk],
    },
    {
      message: "再记一条取快递",
      call: toolCall("create_task", { title: "取快递" }),
      answer: "已添加「取快递」（待办）。",
      state: [milk, delivery],
    },
    {
      message: "我有哪些任务？",
      call: toolCall("list_tasks", {}),
      answer: "你的任务清单：\n- 买牛奶（待办）\n- 取快递（待办）",
      state: [milk, delivery],
    },
    {
      message: "牛奶买好了",
      call: toolCall("complete_task", { reference: "牛奶" }),
      answer: "已完成「买牛奶」。",
      state: [completedMilk, delivery],
    },
    {
      message: "取快递这条删掉吧",
      call: toolCall("delete_task", { reference: "取快递" }),
      answer: "已删除「取快递」。",
      state: [completedMilk],
    },
    {
      message: "再给我看看清单",
      call: toolCall("list_tasks", {}),
      answer: "你的任务清单：\n- 买牛奶（已完成）",
      state: [completedMilk],
    },
  ];

  const history: ChatMessage[] = [];
  for (const scenario of scenarios) {
    history.push({ role: "user", content: scenario.message });
    const reply = createTaskReply(
      tasks,
      getMockClient((messages) => {
        assert.deepEqual(messages.slice(1), history);
        return [scenario.call];
      }),
    );
    const { reply: content } = await reply(history);
    assert.equal(content, scenario.answer);
    assert.deepEqual(
      tasks.list().map(({ title, done }) => [title, done]),
      scenario.state,
    );
    history.push({ role: "assistant", content });
  }

  const reopened = createJsonTaskStore(filename);
  assert.deepEqual(reopened.list(), tasks.list());
  const reply = createTaskReply(
    reopened,
    getMockClient(() => [toolCall("list_tasks", {})]),
  );
  assert.equal(
    (await reply([{ role: "user", content: "我有哪些任务？" }])).reply,
    "你的任务清单：\n- 买牛奶（已完成）",
  );
});

test("多个候选时要求澄清，明确编号后只修改指定任务", async (t) => {
  const { tasks } = await openTestStore(t);
  const milk = tasks.create("买牛奶");
  const oatMilk = tasks.create("买燕麦牛奶");
  const code = `#${oatMilk.id.slice(0, 8)}`;
  const messages: ChatMessage[] = [{ role: "user", content: "牛奶买好了" }];

  const reply = createTaskReply(
    tasks,
    getMockClient((context) => {
      const reference = context.at(-1)?.content === code ? code : "牛奶";
      return [toolCall("complete_task", { reference })];
    }),
  );
  const { reply: answer } = await reply(messages);
  assert.match(answer, /找到多条匹配/);
  assert.ok(answer.includes(code));
  assert.deepEqual(tasks.list(), [milk, oatMilk]);

  messages.push({ role: "assistant", content: answer }, { role: "user", content: code });
  assert.equal((await reply(messages)).reply, "已完成「买燕麦牛奶」。");
  assert.deepEqual(tasks.list(), [milk, { ...oatMilk, done: true }]);
  assert.equal((await reply(messages)).reply, "「买燕麦牛奶」已经完成了。");
});

test("无效或批量工具调用不会修改清单", async (t) => {
  const { tasks } = await openTestStore(t);
  const milk = tasks.create("买牛奶");
  const invalid = toolCall("create_task", { title: "  " });
  const deletion = toolCall("delete_task", { reference: "牛奶" });
  const messages: ChatMessage[] = [{ role: "user", content: "处理牛奶" }];
  const invalidReply = createTaskReply(
    tasks,
    getMockClient(() => [invalid]),
  );
  const multiReply = createTaskReply(
    tasks,
    getMockClient(() => [deletion, invalid]),
  );

  assert.match((await invalidReply(messages)).reply, /有效的操作/);
  assert.match((await multiReply(messages)).reply, /一次发出一个操作/);
  assert.deepEqual(tasks.list(), [milk]);
});

test("澄清工具提示用户补充意图，保留原有任务", async (t) => {
  const { tasks } = await openTestStore(t);
  const task = tasks.create("买牛奶");
  const reply = createTaskReply(
    tasks,
    getMockClient(() => [toolCall("clarify", {})]),
  );

  assert.match((await reply([{ role: "user", content: "你好" }])).reply, /可以告诉我/);
  assert.deepEqual(tasks.list(), [task]);
});

test("模型响应期间任务被替换时，不会把操作转给新任务", async (t) => {
  const { tasks } = await openTestStore(t);
  const original = tasks.create("买牛奶");
  const reply = createTaskReply(
    tasks,
    getMockClient(() => {
      tasks.remove(original.id);
      tasks.create(original.title);
      return [toolCall("complete_task", { reference: "牛奶" })];
    }),
  );

  assert.match((await reply([{ role: "user", content: "牛奶买好了" }])).reply, /清单刚刚有变化/);
  assert.equal(tasks.list().length, 1);
  assert.equal(tasks.list()[0].done, false);
  assert.notEqual(tasks.list()[0].id, original.id);
});

test("相对日期和提醒时间一起写入，回复返回真实任务 ID", async (t) => {
  const { tasks, filename } = await openTestStore(t);
  const reply = createTaskReply(
    tasks,
    getMockClient(() => [
      toolCall("create_task", { title: "去运动康复", date: "下周四", startTime: "10:00" }),
    ]),
    () => new Date("2026-11-25T09:00:00Z"),
  );

  const result = await reply(
    [{ role: "user", content: "下周四上午 10 点提醒我去一个运动康复" }],
    "Europe/Berlin",
  );
  assert.match(result.reply, /2026-12-03 10:00/);
  assert.equal(result.change?.type, "created");
  const [task] = createJsonTaskStore(filename).list();
  assert.deepEqual(task, result.change?.task);
  assert.equal(task.title, "去运动康复");
  assert.equal(task.dueDate, "2026-12-03");
  assert.equal(task.startTime, "10:00");
});

test("按用户时区筛选当天任务和完成状态，保留没有开始时间的待办", async (t) => {
  const { tasks } = await openTestStore(t);
  const date = "2026-11-28";
  tasks.create("读报告", { dueDate: date });
  const done = tasks.create("发邮件", { dueDate: date, startTime: "10:00" });
  tasks.update(done.id, { done: true });
  tasks.create("整理桌面", { dueDate: "2026-11-27" });
  const reply = createTaskReply(
    tasks,
    getMockClient(() => [toolCall("list_tasks", { date: "今天", status: "pending" })]),
    () => new Date("2026-11-27T23:30:00Z"),
  );

  const result = await reply([{ role: "user", content: "今天还有什么没做？" }], "Europe/Berlin");
  assert.equal(result.reply, "你的任务清单：\n- 读报告（待办） · 2026-11-28");
});

test("计划时段与已知日程重叠时给出等长备选，禁止把时段误写成单点", async (t) => {
  const { filename, tasks } = await openTestStore(t);
  const date = "2026-11-28";
  const initial = [
    {
      id: "task-1",
      title: "文档校对",
      done: false,
      dueDate: date,
      startTime: "10:00",
      minutes: 30,
    },
    {
      id: "task-2",
      title: "项目评审",
      done: false,
      dueDate: date,
      startTime: "14:15",
      slotMinutes: 45,
    },
  ];
  await writeFile(filename, JSON.stringify(initial));
  const messages: ChatMessage[] = [{ role: "user", content: "把文档校对安排在明天14:00到14:30。" }];
  const now = () => new Date("2026-11-27T11:00:00Z");
  for (const call of [
    toolCall("clarify", { scheduleReference: "文档校对" }),
    toolCall("create_task", { title: "文档校对", date: "明天", startTime: "14:00" }),
  ]) {
    const reply = createTaskReply(
      tasks,
      getMockClient(() => [call]),
      now,
    );
    const result = await reply(messages, "Europe/Berlin");
    assert.match(result.reply, /14:15–14:30 与「项目评审」重叠/);
    assert.match(result.reply, /15:00–15:30/);
    assert.equal(result.change, undefined);
    assert.deepEqual(tasks.list(), initial);
  }
});

test("零空档时保留已有安排，优先建议可延后的高优先级任务", async (t) => {
  const { filename, tasks } = await openTestStore(t);
  const initial = [
    { id: "task-1", title: "购物", done: false, priority: "low" },
    { id: "task-2", title: "客户会议", done: false, priority: "high", fixed: true },
    { id: "task-3", title: "准备报告", done: false, priority: "high" },
  ];
  await writeFile(filename, JSON.stringify(initial));
  const reply = createTaskReply(
    tasks,
    getMockClient(() => [toolCall("clarify", { noAvailableTime: true })]),
  );
  const result = await reply([{ role: "user", content: "我一点空闲都没有，怎么现在做完这些事？" }]);
  assert.match(result.reply, /当前没有空档.*有空后先处理「准备报告」/);
  assert.deepEqual(tasks.list(), initial);
});

test("模型无工具调用、鉴权失败或超时均给出回退回复且保留清单", async (t) => {
  const { tasks } = await openTestStore(t);
  const messages: ChatMessage[] = [{ role: "user", content: "请列出待办" }];
  const empty = createTaskReply(tasks, getMockClient(() => []));
  assert.match((await empty(messages)).reply, /告诉我/);

  const client = new OpenAI({
    apiKey: "test-only",
    maxRetries: 0,
    async fetch() {
      return Response.json({ error: { message: "test-only" } }, { status: 401 });
    },
  });
  assert.match((await createTaskReply(tasks, () => client)(messages)).reply, /鉴权失败/);

  const timedOut = createTaskReply(tasks, () => {
    throw new OpenAI.APIConnectionTimeoutError();
  });
  assert.match((await timedOut(messages)).reply, /稍后重试/);
  const list = createTaskReply(tasks, getMockClient(() => [toolCall("list_tasks", {})]));
  assert.match((await list(messages)).reply, /清单里还没有任务/);
  assert.deepEqual(tasks.list(), []);
});
