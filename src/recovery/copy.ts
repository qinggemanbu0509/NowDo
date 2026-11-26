import type { Localized } from "./model.ts";
import type { RecoveryAction, RecoveryReason } from "./suggestions.ts";

export const labels = {
  adjust: ["调整任务", "Adjust task"],
  close: ["关闭调整面板", "Close recovery panel"],
  introduction: [
    "计划没有按预期进行？没关系，我们可以调整一下。",
    "Didn't go as planned? That's okay. We can adjust it.",
  ],
  original: ["原始任务", "Original task"],
  schedule: ["计划执行时间", "Planned time"],
  duration: ["预计耗时", "Estimated time"],
  energy: ["精力需求", "Energy needed"],
  deadline: ["硬性截止日期", "Hard deadline"],
  deadlinePassed: [
    "原截止日期已过，仍需跟进。",
    "The original deadline has passed and still needs attention.",
  ],
  afterDeadline: [
    "计划执行时间晚于截止日期，仍有逾期风险。",
    "The planned time is after the deadline and carries a risk of being late.",
  ],
  reasons: ["是什么阻碍了你？", "What got in the way?"],
  missedReason: ["未完成原因", "Reason left unfinished"],
  optional: ["补充原因（选填）", "Add a note (optional)"],
  recommended: ["推荐调整方案", "Suggested adjustment"],
  before: ["调整前", "Before"],
  after: ["调整后", "After"],
  steps: ["子任务", "Subtasks"],
  nextStep: ["下一步", "Next step"],
  block: ["首个行动时段", "First work block"],
  newDate: ["新执行日期", "New planned date"],
  newTime: ["新执行时间", "New planned time"],
  invalidSchedule: ["请选择未来的执行时间。", "Choose a time in the future."],
  apply: ["应用调整", "Apply adjustment"],
  alternate: ["其他方案", "Other option"],
  success: ["任务已调整，按照你的节奏继续。", "Task adjusted. Continue at your own pace."],
  archived: ["任务已归档。", "Task archived."],
  restored: ["已撤销归档，任务已恢复。", "Archive undone. The task has been restored."],
  undo: ["撤销归档", "Undo archive"],
  viewTodo: ["查看待办", "View to-dos"],
  archivedTasks: ["已归档任务", "Archived tasks"],
  local: ["调整仅在当前页面会话中生效。", "Adjustments apply to this page session."],
} satisfies Record<string, Localized>;

export const energyLabels = {
  low: ["低", "Low"],
  medium: ["中", "Medium"],
  high: ["高", "High"],
} satisfies Record<string, Localized>;

export const reasonCopy: Record<
  RecoveryReason,
  { icon: string; title: Localized; hint: Localized; feedback: Localized }
> = {
  time: {
    icon: "⏳",
    title: ["时间不足", "Not enough time"],
    hint: ["空档比预期短", "Your window was shorter"],
    feedback: [
      "原来的时间窗口不够用。可以换个时段，或只做一小段。",
      "The original window was too short. You can pick a new time or make a smaller start.",
    ],
  },
  energy: {
    icon: "🪫",
    title: ["精力不足", "Low energy"],
    hint: ["现在做不动完整任务", "The full task feels draining"],
    feedback: [
      "可以先做一点不费力的准备，按现在的精力来。",
      "A low-effort step can help you get moving at the energy level you have.",
    ],
  },
  difficulty: {
    icon: "🧩",
    title: ["任务太难", "The task feels too hard"],
    hint: ["整件事太有压力", "The whole thing feels daunting"],
    feedback: [
      "任务有点重。把它变成几个具体的动作，先选一个做。",
      "Break the task into concrete actions and start with one.",
    ],
  },
  unclear: {
    icon: "🧭",
    title: ["无从下手", "Unsure where to start"],
    hint: ["需要一个明确的起点", "You need a clear first step"],
    feedback: [
      "先确定一个看得见、做得到的起点。",
      "Give yourself one concrete step you can take right now.",
    ],
  },
  interrupted: {
    icon: "📱",
    title: ["被其他事情打断", "Something interrupted me"],
    hint: ["需要把进度接起来", "You want to pick it back up"],
    feedback: [
      "已经做过的进度仍然有用。找回上次停下的位置，再留一段专注时间。",
      "The work you've done still counts. Find where you stopped and set aside time to continue.",
    ],
  },
  unimportant: {
    icon: "🎯",
    title: ["任务不再重要", "The task matters less now"],
    hint: ["优先事项发生了变化", "Your priorities have changed"],
    feedback: [
      "优先事项有变化很正常。可以留到稍后，也可以把它移出当前清单。",
      "Priorities change. You can leave this for later or set it aside.",
    ],
  },
  other: {
    icon: "💬",
    title: ["其他原因", "Another reason"],
    hint: ["可以补充当时的情况", "Add context if you like"],
    feedback: [
      "可以从重新安排、缩小范围或暂时搁置中选一个。",
      "Choose a new time, a smaller scope, or a pause.",
    ],
  },
};

export const actionCopy: Record<RecoveryAction, { title: Localized; description: Localized }> = {
  reschedule: {
    title: ["重新安排执行时间", "Reschedule the task"],
    description: [
      "挑一个更合适的空档，保留任务内容。",
      "Choose a better window and keep the task as it is.",
    ],
  },
  shorter: {
    title: ["缩短本次行动", "Make this work block shorter"],
    description: [
      "用一个短时段推进一点，余下部分可以之后继续。",
      "Make some progress in a short block and come back to the rest later.",
    ],
  },
  lighter: {
    title: ["降低任务强度", "Lower the effort"],
    description: [
      "把这一轮改成低负担的准备动作。",
      "Make this work block a low-effort preparation step.",
    ],
  },
  split: {
    title: ["拆成三个小步骤", "Split into three steps"],
    description: [
      "从第一步开始，给每个阶段一个清楚的目标。",
      "Start with the first step and give each stage a clear goal.",
    ],
  },
  firstStep: {
    title: ["只做明确的第一步", "Take one clear first step"],
    description: [
      "先做这个具体的小动作，再决定要不要继续。",
      "Take this concrete first step and decide whether to continue afterward.",
    ],
  },
  resume: {
    title: ["接着上次的进度做", "Pick up where you left off"],
    description: [
      "安排一个专注时段，把已经做过的进度接起来。",
      "Choose a focus window to build on the work you've already done.",
    ],
  },
  priority: {
    title: ["降低优先级", "Lower the priority"],
    description: [
      "留在待办中，给当前更重要的任务让出空间。",
      "Keep it open and make room for more important tasks.",
    ],
  },
  archive: {
    title: ["暂时归档", "Archive for now"],
    description: [
      "先从任务清单移走，需要时可以撤销归档。",
      "Move it out of your task list. You can undo this later.",
    ],
  },
};
