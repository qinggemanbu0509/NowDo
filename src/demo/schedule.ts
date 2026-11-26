import { minuteOfDay } from "../../shared/scheduling.ts";
import type { InsightCategory } from "../insights/types.ts";
import {
  taskProfile,
  type Energy,
  type Localized,
  type RecoveryChanges,
  type RecoveryTask,
} from "../recovery/model.ts";
import { demoDateKey, demoClock } from "../dates.ts";
import type { RecoveryReason } from "../recovery/suggestions.ts";

export const demoDate = "2026-11-27";
export const demoTime = "12:00";
export const demoNow = new Date(`${demoDate}T${demoTime}:00+01:00`);
export const prototypeId = "T21";

export type DemoCategory = Extract<
  InsightCategory,
  "work" | "study" | "health" | "social" | "life" | "planning"
>;
export interface DemoItem extends RecoveryTask {
  category: DemoCategory;
  location?: Localized;
  done: boolean;
  missedReason?: RecoveryReason;
}
export type DemoChanges = RecoveryChanges & { done?: boolean };
export const categoryLabels: Record<DemoCategory, Localized> = {
  work: ["工作", "Work"],
  study: ["学习", "Learning"],
  health: ["健康", "Health"],
  social: ["社交", "Social"],
  life: ["生活", "Life"],
  planning: ["规划", "Planning"],
};

type Row = readonly [
  day: number,
  zh: string,
  en: string,
  start: string,
  end: string,
  category: DemoCategory,
  energy: Energy,
  fixed: boolean,
  location?: Localized,
];
const missedReasons: Partial<Record<string, RecoveryReason>> = {
  T07: "unclear",
  T12: "difficulty",
  T15: "energy",
  T17: "interrupted",
  [prototypeId]: "time",
};

const rows: readonly Row[] = [
  [23, "晨间阅读", "Morning reading", "08:00", "08:30", "study", "low", false],
  [
    23,
    "每周团队会议",
    "Weekly team meeting",
    "09:00",
    "10:00",
    "work",
    "medium",
    true,
    ["会议室 A", "Meeting room A"],
  ],
  [23, "项目方案设计", "Design the project proposal", "10:30", "12:00", "work", "high", false],
  [23, "深度工作", "Deep work", "14:00", "16:00", "work", "high", false],
  [23, "健身训练", "Gym workout", "18:00", "19:30", "health", "high", false, ["健身房", "Gym"]],
  [24, "邮件与消息处理", "Email and messages", "08:30", "09:00", "work", "low", false],
  [24, "UI/UX 设计学习", "Study UI/UX design", "10:00", "11:30", "study", "high", false],
  [
    24,
    "产品需求讨论",
    "Discuss product requirements",
    "13:30",
    "14:30",
    "work",
    "medium",
    true,
    ["Google Meet", "Google Meet"],
  ],
  [
    24,
    "外语口语练习",
    "Practice speaking a foreign language",
    "16:00",
    "17:00",
    "study",
    "medium",
    false,
  ],
  [
    24,
    "超市采购",
    "Grocery shopping",
    "18:30",
    "19:00",
    "life",
    "low",
    false,
    ["超市", "Supermarket"],
  ],
  [25, "晨跑", "Morning run", "07:30", "08:15", "health", "medium", false, ["公园", "Park"]],
  [25, "数据分析与整理", "Analyze and organize data", "09:30", "11:30", "work", "high", false],
  [
    25,
    "与朋友共进午餐",
    "Lunch with a friend",
    "12:00",
    "13:00",
    "social",
    "low",
    true,
    ["咖啡厅", "Café"],
  ],
  [25, "项目进度检查", "Check project progress", "14:00", "15:00", "work", "medium", true],
  [
    25,
    "阅读与自由学习",
    "Reading and independent study",
    "19:00",
    "20:00",
    "study",
    "medium",
    false,
  ],
  [26, "创意头脑风暴", "Creative brainstorming", "09:00", "10:00", "work", "high", false],
  [26, "撰写项目报告", "Write the project report", "10:30", "12:30", "work", "high", false],
  [
    26,
    "线上技能培训",
    "Online skills training",
    "14:00",
    "15:30",
    "study",
    "medium",
    true,
    ["Online", "Online"],
  ],
  [
    26,
    "篮球训练",
    "Basketball practice",
    "18:00",
    "20:00",
    "health",
    "high",
    true,
    ["体育馆", "Sports hall"],
  ],
  [27, "整理本周工作成果", "Summarize this week's work", "09:00", "10:30", "work", "medium", false],
  [27, "产品原型测试", "Test the product prototype", "11:00", "12:00", "work", "high", false],
  [
    27,
    "团队周度复盘",
    "Weekly team review",
    "15:00",
    "16:00",
    "work",
    "medium",
    true,
    ["会议室 B", "Meeting room B"],
  ],
  [
    27,
    "朋友聚餐",
    "Dinner with friends",
    "19:00",
    "21:00",
    "social",
    "low",
    true,
    ["餐厅", "Restaurant"],
  ],
  [
    28,
    "房间清洁与整理",
    "Clean and tidy the room",
    "10:00",
    "11:00",
    "life",
    "medium",
    false,
    ["家中", "Home"],
  ],
  [28, "个人项目开发", "Work on a personal project", "13:00", "15:30", "work", "high", false],
  [
    28,
    "户外散步",
    "Take a walk outside",
    "16:00",
    "17:00",
    "health",
    "low",
    false,
    ["公园", "Park"],
  ],
  [28, "电影之夜", "Movie night", "20:00", "22:00", "life", "low", false],
  [
    29,
    "瑜伽与拉伸",
    "Yoga and stretching",
    "09:30",
    "10:00",
    "health",
    "low",
    false,
    ["家中", "Home"],
  ],
  [
    29,
    "阅读与咖啡时间",
    "Reading and coffee",
    "11:00",
    "12:00",
    "study",
    "low",
    false,
    ["咖啡厅", "Café"],
  ],
  [
    29,
    "下周饮食准备",
    "Prep next week's meals",
    "15:00",
    "16:00",
    "life",
    "medium",
    false,
    ["家中", "Home"],
  ],
  [29, "每周个人复盘", "Weekly personal review", "18:00", "18:30", "planning", "medium", false],
  [29, "制定下周计划", "Plan next week", "20:00", "20:30", "planning", "medium", false],
];

export { clockLabel, minuteOfDay } from "../../shared/scheduling.ts";

export const demoSchedule: readonly DemoItem[] = rows.map(
  ([day, zh, en, start, end, category, energy, fixed, location], index) => {
    const id = `T${String(index + 1).padStart(2, "0")}`;
    const title: Localized = [zh, en];
    const minutes = minuteOfDay(end) - minuteOfDay(start);
    return {
      id,
      title,
      category,
      location,
      energy,
      fixed,
      minutes,
      slotMinutes: minutes,
      deadline: null,
      schedule: { date: `2026-11-${day}`, time: start },
      done: index < 20 && !missedReasons[id],
      missedReason: missedReasons[id],
      priority: id === prototypeId || fixed ? "high" : "medium",
      profile: taskProfile(title),
    };
  },
);

export const prototypeOriginal = demoSchedule.find((task) => task.id === prototypeId)!;

export function demoDayItems(items: readonly DemoItem[], now: Date) {
  const date = demoDateKey(now);
  return items
    .filter((item) => !item.archived && item.schedule?.date === date)
    .sort((left, right) => (left.schedule?.time ?? "").localeCompare(right.schedule?.time ?? ""));
}

export function demoWindow(items: readonly DemoItem[], now: Date) {
  const minute = minuteOfDay(demoClock.format(now));
  const timed = demoDayItems(items, now).filter((item) => item.schedule?.time && !item.done);
  const current = timed.find((item) => {
    const start = minuteOfDay(item.schedule!.time!);
    return start <= minute && minute < start + (item.slotMinutes ?? item.minutes ?? 0);
  });
  const next = timed.find((item) => minuteOfDay(item.schedule!.time!) > minute);
  const until = current ? minute : next ? minuteOfDay(next.schedule!.time!) : 24 * 60;
  return { current, next, until, minute, available: until - minute };
}
