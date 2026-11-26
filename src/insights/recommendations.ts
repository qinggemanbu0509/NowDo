import type { InsightEnergy, InsightTask } from "./types.ts";

export const timePresets = [5, 10, 15, 30, 60, 120] as const;
export const energyLevels = ["low", "medium", "high"] as const;

export interface RecommendationCriteria {
  minutes: number;
  energy: InsightEnergy;
}

export interface RecommendationSource {
  getCandidates(criteria: RecommendationCriteria): readonly InsightTask[];
}

interface RecommendationList {
  shown: InsightTask[];
  remaining: InsightTask[];
}

export function createRecommendationList(
  candidates: readonly InsightTask[],
  count = 3,
): RecommendationList {
  return {
    shown: candidates.slice(0, count),
    remaining: candidates.slice(count),
  };
}

function shuffle(tasks: InsightTask[]): InsightTask[] {
  for (let index = tasks.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [tasks[index], tasks[other]] = [tasks[other], tasks[index]];
  }
  return tasks;
}

export function replaceRecommendation(
  list: RecommendationList,
  slot: number,
  candidates: readonly InsightTask[],
): RecommendationList {
  const remaining = list.remaining.length
    ? list.remaining
    : shuffle(candidates.filter((task) => !list.shown.some((visible) => visible.id === task.id)));
  const [replacement, ...rest] = remaining;
  if (!replacement) return list;

  return { shown: list.shown.with(slot, replacement), remaining: rest };
}
