import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Language } from "../shared/language.ts";
import { demoTimeZone } from "./dates.ts";

const copy = {
  openSettings: ["打开设置", "Open settings"],
  settings: ["设置", "Settings"],
  closeSettings: ["关闭设置", "Close settings"],
  language: ["语言", "Language"],
  darkMode: ["深色模式", "Dark mode"],
  replay: ["重播开屏", "Replay opening"],
  minute: ["分钟", "min"],
  estimate: ["预计", "Estimated"],
  navToday: ["当下", "Now"],
  navTasks: ["任务池", "Tasks"],
  navCalendar: ["计划", "Plan"],
  navInsights: ["洞察", "Insights"],
  navigation: ["主导航", "Main navigation"],
  conversation: ["与 NowDo 的对话", "Conversation with NowDo"],
  closeConversation: ["收起对话", "Close conversation"],
  history: ["NowDo 对话记录", "NowDo conversation history"],
  conversationLog: ["对话记录", "Conversation log"],
  message: ["消息", "Message"],
  placeholder: ["问问 NowDo 今天的安排…", "Ask NowDo about the schedule…"],
  livePlaceholder: ["让 NowDo 帮你管理待办…", "Ask NowDo to manage your to-dos…"],
  send: ["发送消息", "Send message"],
  chatWaiting: ["NowDo 正在处理…", "NowDo is working on it…"],
  chatFailed: [
    "没有收到回复。请在聊天中查询任务，确认结果后再重试。",
    "No reply received. Ask for your task list in chat before retrying.",
  ],
  chatExample: ["可以问「今天还有什么安排？」", "Try “What is on my schedule today?”"],
  you: ["你", "You"],
  opening: ["Tokenow·NowDo 开屏", "Tokenow·NowDo opening screen"],
  skip: ["跳过", "Skip"],
  todo: ["待办", "To do"],
  done: ["已完成", "Completed"],
  overdue: ["未完成", "Unfinished"],
  todayTasks: ["今日待办", "Due today"],
  nextSeven: ["未来七天", "Next seven days"],
  later: ["更久", "Later"],
  noDate: ["未安排日期", "Unscheduled"],
  low: ["低优先级", "Low priority"],
  medium: ["中优先级", "Medium priority"],
  high: ["高优先级", "High priority"],
  due: ["截止", "due"],
  priority: ["优先级", "Priority"],
  noPriority: ["无", "None"],
  unset: ["未设置", "Not set"],
  taskStatus: ["任务状态", "Task status"],
  dateRange: ["时间范围", "Date range"],
  allTasks: ["全部待办", "All to-dos"],
  noCompleted: ["暂无已完成任务。", "No completed tasks yet."],
  noOverdue: ["暂无未完成任务。", "No unfinished tasks."],
  emptyTasks: ["暂无待办任务。", "No tasks to do."],
  emptyRange: ["这个时间范围内暂无待办。", "No tasks in this date range."],
  today: ["今天", "Today"],
  backToThisWeek: ["回到本周", "Back to this week"],
  changeWeek: ["切换日历周", "Change calendar week"],
  previousWeek: ["上一周", "Previous week"],
  nextWeek: ["下一周", "Next week"],
  weekCalendar: [
    "每周日历，可左右滑动查看日期，上下滚动查看时间",
    "Weekly calendar. Scroll sideways for days and vertically for times.",
  ],
} as const;

type CopyKey = keyof typeof copy;
const languageKey = "nowdo.language";

const dateFormatters = {
  zh: {
    fullDateFormat: new Intl.DateTimeFormat("zh-CN", { timeZone: demoTimeZone, month: "long", day: "numeric" }),
    weekdayFormat: new Intl.DateTimeFormat("zh-CN", { timeZone: demoTimeZone, weekday: "long" }),
  },
  en: {
    fullDateFormat: new Intl.DateTimeFormat("en-GB", { timeZone: demoTimeZone, month: "short", day: "numeric" }),
    weekdayFormat: new Intl.DateTimeFormat("en-GB", { timeZone: demoTimeZone, weekday: "long" }),
  },
};

interface InterfaceLanguage {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: CopyKey) => string;
  fullDateFormat: Intl.DateTimeFormat;
  weekdayFormat: Intl.DateTimeFormat;
}

const LanguageContext = createContext<InterfaceLanguage | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem(languageKey) === "en" ? "en" : "zh";
    } catch {
      return "zh";
    }
  });

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    try {
      localStorage.setItem(languageKey, language);
    } catch {
      // The current language remains active if browser storage is unavailable.
    }
  }, [language]);

  const t = (key: CopyKey) => copy[key][language === "en" ? 1 : 0];
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, ...dateFormatters[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is required.");
  return context;
}
