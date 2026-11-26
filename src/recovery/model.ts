import type { Language } from "../../shared/language.ts";
import type { TaskPriority } from "../../shared/tasks.ts";
import { demoClock, demoDateKey } from "../dates.ts";
import { minuteOfDay } from "../../shared/scheduling.ts";

export type Localized = readonly [zh: string, en: string];
export type Energy = "low" | "medium" | "high";

export function localized(value: Localized, language: Language) {
  return value[language === "zh" ? 0 : 1];
}

export interface ExecutionTime {
  date: string;
  time: string | null;
}

export interface RecoveryProfile {
  lighter: Localized;
  firstStep: Localized;
  steps: readonly [Localized, Localized, Localized];
  resume: Localized;
}

export interface RecoveryTask {
  id: string;
  title: Localized;
  schedule: ExecutionTime | null;
  deadline: string | null;
  minutes: number | null;
  energy: Energy | null;
  priority: TaskPriority | null;
  profile: RecoveryProfile;
  steps?: readonly Localized[];
  nextStep?: Localized;
  archived?: boolean;
  fixed?: boolean;
  slotMinutes?: number;
}

export type RecoveryChanges = Partial<
  Pick<
    RecoveryTask,
    "title" | "schedule" | "minutes" | "energy" | "priority" | "steps" | "nextStep" | "archived"
  >
>;

export function taskProfile(title: Localized): RecoveryProfile {
  return {
    lighter: [`整理「${title[0]}」需要的材料`, `Gather materials for “${title[1]}”`],
    firstStep: [`写下「${title[0]}」要交付的一个结果`, `Write down one outcome for “${title[1]}”`],
    steps: [
      ["列出要交付的结果", "List the outcome you need"],
      ["准备所需的材料或工具", "Prepare the materials or tools"],
      ["先完成一部分，再检查结果", "Finish one part and review the result"],
    ],
    resume: [
      "回看上次做到哪里，记下剩下的第一个步骤。",
      "Find where you left off and write down the next unfinished step.",
    ],
  };
}

export function isPlanMissed(schedule: ExecutionTime | null, now: Date) {
  if (!schedule) return false;
  const today = demoDateKey(now);
  return schedule.date < today ||
    (schedule.date === today && !!schedule.time && schedule.time < demoClock.format(now));
}

export function deadlineRisk(task: RecoveryTask, today: string) {
  if (!task.deadline) return null;
  if (task.deadline < today) return "deadlinePassed";
  return task.schedule && task.schedule.date > task.deadline ? "afterDeadline" : null;
}

export function isRecoveryOverdue(task: RecoveryTask, now: Date) {
  const today = demoDateKey(now);
  if (task.deadline !== null && task.deadline < today) return true;
  if (task.schedule?.date === today && task.schedule.time && task.slotMinutes != null) {
    const end = minuteOfDay(task.schedule.time) + task.slotMinutes;
    return end <= minuteOfDay(demoClock.format(now));
  }
  return isPlanMissed(task.schedule, now);
}
