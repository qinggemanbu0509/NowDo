import type { Localized, Energy } from "../recovery/model.ts";

interface PrototypeStep {
  title: Localized;
  minutes: number;
  energy: Energy;
}

export const prototypeFocus = {
  low: {
    title: ["整理产品测试清单", "Organize the product testing checklist"],
    minutes: 10,
    energy: "low",
  },
  medium: {
    title: ["检查产品基础功能", "Check the basic product features"],
    minutes: 30,
    energy: "medium",
  },
  high: {
    title: ["完成产品原型测试", "Finish testing the product prototype"],
    minutes: 60,
    energy: "high",
  },
} as const satisfies Record<Energy, PrototypeStep>;

export const prototypeRecovery = {
  time: {
    title: ["测试产品核心交互", "Test the core product interactions"],
    minutes: 10,
    energy: "high",
  },
  energy: prototypeFocus.low,
  difficulty: {
    ...prototypeFocus.medium,
    title: ["优先检查基础功能", "Check the basic features first"],
  },
  unclear: {
    title: ["列出三个核心测试场景", "List three key test scenarios"],
    minutes: 10,
    energy: "low",
  },
  interrupted: {
    title: ["从上次测试进度继续", "Resume where testing left off"],
    minutes: 30,
    energy: "medium",
  },
  unimportant: { title: ["重新评估测试范围与优先级", "Reassess the test scope and priority"] },
  other: {
    title: ["将测试任务重新安排至午餐后", "Reschedule testing for after lunch"],
    minutes: 60,
    energy: "high",
  },
} as const;
