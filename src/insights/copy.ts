import type { Language } from "../../shared/language.ts";
import type { InsightTask } from "./types.ts";
import type { RecommendationCriteria } from "./recommendations.ts";

const energyNames = { low: "Low", medium: "Medium", high: "High" };
export const energySymbols = { low: "🪫", medium: "🔋", high: "⚡" };

const copy = {
  zh: {
    title: "现在做点什么？",
    time: "可用时间",
    energy: "精力状态",
    custom: "自定义",
    minutes: "分钟",
    hours: "小时",
    customMinutes: "自定义时长（分钟）",
    invalidMinutes: "请输入至少 1 分钟的整数时长。",
    recommended: "为你推荐",
    count: (count: number) => `${count} 个适合的任务`,
    featured: "首选推荐",
    start: "开始行动",
    swap: "换一个",
    started: "任务已启动",
    back: "返回推荐",
    energyNames: { low: "疲惫", medium: "一般", high: "充沛" },
    energyShort: energyNames,
    priorities: { low: "低优先级", medium: "中优先级", high: "高优先级" },
    categories: {
      study: "学习",
      work: "工作",
      life: "生活",
      health: "健康",
      growth: "成长",
      creativity: "创意",
      planning: "规划",
      social: "社交",
    },
    gentle: "需要的精力较少，容易开始。",
    fits: "时长刚好，也符合你现在的精力。",
    buffer: "能在空档内完成，还能留出一点余量。",
    important: "优先级高，适合用这段空档推进。",
  },
  en: {
    title: "What can I do now?",
    time: "Time available",
    energy: "Energy level",
    custom: "Custom",
    minutes: "min",
    hours: "h",
    customMinutes: "Custom duration in minutes",
    invalidMinutes: "Enter a whole number of minutes, at least 1.",
    recommended: "Recommended for you",
    count: (count: number) => `${count} matching tasks`,
    featured: "Top pick",
    start: "Start task",
    swap: "Swap",
    started: "Task started",
    back: "Back to recommendations",
    energyNames,
    energyShort: { low: "Tired", medium: "Steady", high: "Energized" },
    priorities: { low: "Low priority", medium: "Medium priority", high: "High priority" },
    categories: {
      study: "Study",
      work: "Work",
      life: "Life",
      health: "Health",
      growth: "Growth",
      creativity: "Creative",
      planning: "Planning",
      social: "Social",
    },
    gentle: "This takes less energy, so it's easy to get started.",
    fits: "A good fit for both your time and energy.",
    buffer: "Fits your window with a little time to spare.",
    important: "A high-priority task you can move forward in this window.",
  },
};

export function getInsightsCopy(language: Language) {
  return copy[language];
}

export function recommendationReason(
  task: InsightTask,
  criteria: RecommendationCriteria,
  labels: ReturnType<typeof getInsightsCopy>,
) {
  if (task.energy !== criteria.energy) return labels.gentle;
  if (task.priority === "high") return labels.important;
  if (task.minutes === criteria.minutes) return labels.fits;
  return labels.buffer;
}
