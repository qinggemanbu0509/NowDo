import type { Language } from "../shared/language.ts";
import { clockLabel, minuteOfDay, readDueDate, readStartTime, resolveNumericTime } from "../shared/scheduling.ts";
import type { TaskStore } from "./task-store.ts";

type Task = ReturnType<TaskStore["list"]>[number];
const dayEnd = 24 * 60;

export function readTaskWindow(text: string) {
  const match = text
    .normalize("NFKC")
    .match(
      /(?<![\d:])(?:(凌晨|清晨|早上|上午|中午|下午|傍晚|晚上)\s*)?(\d{1,2}:\d{2})\s*(?:[-–—~]|至|到)\s*(?:(凌晨|清晨|早上|上午|中午|下午|傍晚|晚上)\s*)?(\d{1,2}:\d{2})(?![\d:])/u,
    );
  if (!match) return null;
  const [, fromPeriod, from, toPeriod, to] = match;
  return {
    start: resolveNumericTime((fromPeriod ?? "") + from),
    end: to === "24:00" && !toPeriod ? to : resolveNumericTime((toPeriod ?? fromPeriod ?? "") + to),
  };
}

function span(start: number, end: number) {
  return `${clockLabel(start)}–${clockLabel(end)}`;
}

function scheduledBlocks(tasks: Task[], target: Task | undefined, date: string) {
  return tasks
    .flatMap((task) => {
      const time = readStartTime(task.startTime);
      if (
        !time ||
        task.id === target?.id ||
        task.done ||
        task.archived === true ||
        readDueDate(task.dueDate) !== date
      )
        return [];
      const duration = [task.slotMinutes, task.minutes].find(
        (value): value is number =>
          typeof value === "number" && Number.isInteger(value) && value > 0,
      );
      const start = minuteOfDay(time);
      return [
        {
          title: task.title,
          start,
          end: duration === undefined ? null : Math.min(dayEnd, start + duration),
        },
      ];
    })
    .sort((left, right) => left.start - right.start);
}

export function checkTaskWindow(
  tasks: Task[],
  target: Task | undefined,
  date: string,
  window: NonNullable<ReturnType<typeof readTaskWindow>>,
  today: string,
  currentTime: string,
  language: Language,
) {
  const zh = language === "zh";
  const start = window.start ? minuteOfDay(window.start) : dayEnd;
  const end = window.end ? minuteOfDay(window.end) : 0;
  if (start >= end)
    return zh ? "请提供有效的同日起止时间。" : "Give a valid time range within one day.";

  const blocks = scheduledBlocks(tasks, target, date);
  const conflict = blocks.find(
    (block) => block.start < end && block.end !== null && block.end > start,
  );
  const unchanged = target
    ? zh
      ? `「${target.title}」仍保留原安排。`
      : `“${target.title}” keeps its original schedule. `
    : "";
  if (!conflict || conflict.end === null) {
    if (blocks.some((block) => block.start < end && block.end === null)) {
      return (
        unchanged +
        (zh
          ? "部分日程缺少结束时间，无法核实该时段是否冲突。"
          : "Some events have no end time, so this window cannot be verified.")
      );
    }
    return (
      unchanged +
      (zh
        ? "这个时段未发现冲突。聊天暂不支持保存起止时段，可通过任务 API 修改日期和开始时间。"
        : "No conflict was found. Chat cannot save a time range. Use the task API to change the date and start time.")
    );
  }

  const overlap = span(Math.max(start, conflict.start), Math.min(end, conflict.end));
  const conflictMessage = zh
    ? `${date} ${overlap} 与「${conflict.title}」重叠。`
    : `${date} ${overlap} overlaps with “${conflict.title}”. `;
  const duration = end - start;
  let next = Math.max(start, date === today ? minuteOfDay(currentTime) : 0);
  for (const block of blocks) {
    if (next + duration <= block.start) break;
    next = Math.max(next, block.end ?? dayEnd);
  }
  const alternative =
    date >= today && next + duration <= dayEnd
      ? zh
        ? `可在计划中考虑 ${span(next, next + duration)}。`
        : `Consider ${span(next, next + duration)} in your plan.`
      : zh
        ? "当天没有可核实的备选时段，请另选日期。"
        : "No alternative could be verified that day. Choose another date.";
  return unchanged + conflictMessage + alternative;
}
