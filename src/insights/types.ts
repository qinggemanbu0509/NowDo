import type { Language } from "../../shared/language.ts";
import type { TaskPriority } from "../../shared/tasks.ts";

export type InsightEnergy = "low" | "medium" | "high";
export type InsightCategory =
  | "study"
  | "work"
  | "life"
  | "health"
  | "growth"
  | "creativity"
  | "planning"
  | "social";

export interface InsightTask {
  id: string;
  sourceId?: string;
  title: Record<Language, string>;
  category: InsightCategory;
  minutes: number;
  energy: InsightEnergy;
  priority: TaskPriority;
}
