import { prototypeFocus, prototypeRecovery } from "../demo/prototype.ts";
import { prototypeId, prototypeOriginal } from "../demo/schedule.ts";
import type { ExecutionTime, Localized, RecoveryChanges, RecoveryTask } from "./model.ts";

export const recoveryReasons = [
  "time",
  "energy",
  "difficulty",
  "unclear",
  "interrupted",
  "unimportant",
  "other",
] as const;
export type RecoveryReason = (typeof recoveryReasons)[number];
export type RecoveryAction =
  | "reschedule"
  | "shorter"
  | "lighter"
  | "firstStep"
  | "split"
  | "resume"
  | "priority"
  | "archive";

interface RecoverySuggestion {
  action: RecoveryAction;
  heading?: Localized;
  changes: RecoveryChanges;
}

export interface RecoverySuggestionSource {
  getSuggestions(
    task: RecoveryTask,
    reason: RecoveryReason,
    nextSchedule: ExecutionTime,
  ): readonly RecoverySuggestion[];
}

const actionsByReason: Record<RecoveryReason, readonly RecoveryAction[]> = {
  time: ["reschedule", "shorter", "split"],
  energy: ["lighter", "shorter", "reschedule"],
  difficulty: ["split", "lighter", "firstStep"],
  unclear: ["firstStep", "split", "lighter"],
  interrupted: ["resume", "reschedule", "shorter"],
  unimportant: ["priority", "archive", "reschedule"],
  other: ["reschedule", "split", "archive"],
};

function prototypeSuggestion(
  task: RecoveryTask,
  reason: RecoveryReason,
  schedule: ExecutionTime,
): RecoverySuggestion {
  const step = prototypeRecovery[reason];
  const action: RecoveryAction = (
    {
      time: "shorter",
      energy: "lighter",
      difficulty: "lighter",
      unclear: "firstStep",
      interrupted: "resume",
      unimportant: "priority",
      other: "reschedule",
    } as const
  )[reason];
  if (reason === "unimportant") {
    return {
      action,
      heading: step.title,
      changes: { priority: task.priority === "high" ? "medium" : "low", nextStep: step.title },
    };
  }
  const work = prototypeRecovery[reason];
  const details = { minutes: work.minutes, energy: work.energy };
  const changes: RecoveryChanges =
    reason === "other"
      ? {
          ...details,
          schedule,
          title: prototypeOriginal.title,
          steps: [],
          nextStep: undefined,
        }
      : {
          ...details,
          title: reason === "difficulty" ? prototypeFocus.medium.title : work.title,
          steps: [],
          nextStep: undefined,
        };
  return { action, heading: work.title, changes };
}

export const mockRecoverySource: RecoverySuggestionSource = {
  getSuggestions(task, reason, nextSchedule) {
    const profile = task.profile;
    const limit = (minutes: number) => Math.min(task.minutes ?? minutes, minutes);
    const changes: Record<RecoveryAction, RecoveryChanges> = {
      reschedule: { schedule: nextSchedule },
      shorter: { minutes: limit(15), energy: "low", nextStep: profile.firstStep },
      lighter: {
        title: profile.lighter,
        minutes: limit(10),
        energy: "low",
        steps: [],
        nextStep: undefined,
      },
      firstStep: {
        title: profile.firstStep,
        minutes: limit(5),
        energy: "low",
        steps: [],
        nextStep: undefined,
      },
      split: {
        minutes: limit(15),
        energy: task.energy === "low" ? "low" : "medium",
        steps: profile.steps,
        nextStep: undefined,
      },
      resume: { schedule: nextSchedule, minutes: limit(25), nextStep: profile.resume },
      priority: { priority: task.priority === "high" ? "medium" : "low" },
      archive: { archived: true },
    };

    const suggestions = actionsByReason[reason]
      .map((action) => (action === "priority" && task.priority === "low" ? "lighter" : action))
      .map((action) => ({ action, changes: changes[action] }))
      .filter((suggestion) => !task.fixed || !suggestion.changes.schedule);

    if (task.id !== prototypeId) return suggestions;
    const first = prototypeSuggestion(task, reason, nextSchedule);
    return [first, ...suggestions.filter(({ action }) => action !== first.action).slice(0, 2)];
  },
};
