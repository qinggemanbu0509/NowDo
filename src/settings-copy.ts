export const settingsCopy = {
  general: ["通用设置", "General"],
  smart: ["智能推荐偏好", "Smart Preferences"],
  calendar: ["日历与数据", "Calendar & Data"],
  about: ["关于", "About"],
  back: ["返回设置", "Back to settings"],
  behavior: ["AI 行为偏好", "AI behavior preferences"],
  reminders: ["任务提醒偏好", "Task reminders"],
  off: ["不提醒", "Off"],
  atStart: ["开始时", "At start"],
  beforeStart: ["提前 15 分钟", "15 min before"],
  smartToggle: ["智能任务推荐", "Smart recommendations"],
  available: ["默认可用时间", "Default available time"],
  recommendationCount: ["推荐任务数量", "Recommendation count"],
  recovery: ["未完成任务反馈", "Incomplete task feedback"],
  pace: ["AI 执行节奏", "AI execution pace"],
  bias: ["AI 推荐倾向", "AI recommendation bias"],
  weekStart: ["每周起始日", "Start of week"],
  monday: ["周一", "Monday"],
  sunday: ["周日", "Sunday"],
  clock: ["时间格式", "Time format"],
  hours12: ["12 小时制", "12-hour"],
  hours24: ["24 小时制", "24-hour"],
  integrations: ["第三方应用集成", "App integrations"],
  privacy: ["数据与隐私", "Data & privacy"],
  privacyNote: [
    "设置保存在当前浏览器，演示任务在刷新后重置。演示聊天在本地生成，真实聊天会把近期对话和任务信息发送给 DeepSeek。",
    "Settings are saved in this browser. Demo tasks reset on refresh. Demo replies are generated locally. Live chat sends recent messages and task information to DeepSeek.",
  ],
  version: ["版本", "Version"],
  developer: ["开发者", "Developer"],
  twoHours: ["2 小时", "2 hours"],
} as const;

export const paceLevels = [
  {
    label: ["轻松", "Relaxed"],
    hint: [
      "预览偏好：从轻量、短时的任务开始，给休息留出空间。",
      "Preference preview: Start with short, light tasks and leave room for breaks.",
    ],
  },
  {
    label: ["平衡", "Balanced"],
    hint: [
      "预览偏好：在投入程度与任务推进之间保持平衡。",
      "Preference preview: Balance effort with steady progress.",
    ],
  },
  {
    label: ["进取", "Ambitious"],
    hint: [
      "预览偏好：空档充裕时，愿意尝试更有挑战的任务。",
      "Preference preview: Take on more challenging tasks when there is time.",
    ],
  },
] as const;

export const biasLevels = [
  {
    label: ["容易完成", "Quick wins"],
    hint: [
      "预览偏好：倾向先看门槛低、容易收尾的任务。",
      "Preference preview: Favor tasks that are easy to start and finish.",
    ],
  },
  {
    label: ["综合考虑", "Balanced"],
    hint: [
      "预览偏好：同时考虑耗时、精力和任务重要性。",
      "Preference preview: Weigh time, energy, and importance together.",
    ],
  },
  {
    label: ["重要优先", "Importance first"],
    hint: [
      "预览偏好：优先考虑影响更大的任务。",
      "Preference preview: Give more weight to high-impact tasks.",
    ],
  },
] as const;
