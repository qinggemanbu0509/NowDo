import type { InsightTask } from "../insights/types.ts";
import { energyLevels, type RecommendationSource } from "../insights/recommendations.ts";
import { demoWindow, prototypeId, prototypeOriginal, type DemoItem } from "./schedule.ts";
import { prototypeFocus } from "./prototype.ts";

export function calendarRecommendations(
  items: readonly DemoItem[],
  now: Date,
): RecommendationSource {
  const open = items.filter((item) => !item.done && !item.archived && !item.fixed);
  const window = demoWindow(items, now);
  const prototype = open.find((item) => item.id === prototypeId);
  const unchanged =
    prototype?.title === prototypeOriginal.title && prototype.minutes === prototypeOriginal.minutes;
  const prototypeCards: InsightTask[] =
    prototype && unchanged
      ? Object.values(prototypeFocus).map((step) => ({
          ...step,
          title: { zh: step.title[0], en: step.title[1] },
          id: `${prototypeId}-${step.energy}`,
          sourceId: prototypeId,
          category: prototype.category,
          priority: prototype.priority ?? "medium",
        }))
      : [];
  const candidates = [
    ...prototypeCards,
    ...open.flatMap((item): InsightTask[] =>
      item.minutes && item.energy && !(unchanged && item.id === prototypeId)
        ? [
            {
              id: item.id,
              sourceId: item.id,
              title: { zh: item.title[0], en: item.title[1] },
              category: item.category,
              minutes: item.minutes,
              energy: item.energy,
              priority: item.priority ?? "medium",
            },
          ]
        : [],
    ),
  ];

  return {
    getCandidates({ minutes, energy }) {
      const limit = Math.min(minutes, window.available);
      const rank = energyLevels.indexOf(energy);
      return candidates
        .filter((item) => item.minutes <= limit && energyLevels.indexOf(item.energy) <= rank)
        .sort(
          (a, b) =>
            Number(b.sourceId === prototypeId) - Number(a.sourceId === prototypeId) ||
            energyLevels.indexOf(b.energy) - energyLevels.indexOf(a.energy) ||
            b.minutes - a.minutes,
        );
    },
  };
}

export function prototypeRecommendations(items: readonly DemoItem[], now: Date) {
  return calendarRecommendations(items, now)
    .getCandidates({ minutes: 120, energy: "high" })
    .filter((item) => item.sourceId === prototypeId)
    .sort((a, b) => energyLevels.indexOf(a.energy) - energyLevels.indexOf(b.energy));
}
