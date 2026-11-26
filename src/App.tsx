import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ChatMessage } from "../shared/chat.ts";
import { AppIcon } from "./AppIcon.tsx";
import { CalendarPage } from "./CalendarPage.tsx";
import { getChatMode, requestReply, type ChatMode } from "./chat-client.ts";
import { DemoHome, DemoScheduleTable } from "./demo/DemoViews.tsx";
import { calendarRecommendations, prototypeRecommendations } from "./demo/recommendations.ts";
import {
  demoDate,
  demoDayItems,
  demoNow,
  demoSchedule,
  demoTime,
  demoWindow,
  type DemoChanges,
} from "./demo/schedule.ts";
import { ChatHistory } from "./ChatHistory.tsx";
import { InsightsPage } from "./insights/InsightsPage.tsx";
import { useLanguage } from "./interface-language.tsx";
import { SettingsDrawer } from "./SettingsDrawer.tsx";
import { LaunchScreen, nowDoLogo, rememberLaunch, shouldShowLaunch } from "./LaunchScreen.tsx";
import { formatClock, usePreferences } from "./preferences.ts";
import { TasksPanel } from "./TasksPanel.tsx";

const pages = [
  { id: "today", label: "navToday", icon: "today" },
  { id: "tasks", label: "navTasks", icon: "tasks" },
  { id: "calendar", label: "navCalendar", icon: "calendar" },
  { id: "insights", label: "navInsights", icon: "insights" },
] as const;

type Page = (typeof pages)[number]["id"];

function isSendShortcut(event: KeyboardEvent<HTMLTextAreaElement>) {
  // 中文输入法会用 Enter 确认选词，部分浏览器此时只报告键码 229。
  const composing = event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229;
  return event.key === "Enter" && !event.shiftKey && !composing;
}

export default function App() {
  const { language, t } = useLanguage();
  const { preferences, setPreference } = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => document.documentElement.dataset.theme !== "light",
  );

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", darkMode ? "#101010" : "#f6f8fb");
    try {
      localStorage.setItem("nowdo.theme", theme);
    } catch {
      // The selected theme still applies when browser storage is unavailable.
    }
  }, [darkMode]);
  const [demo, setDemo] = useState({ items: demoSchedule, revision: 0 });

  function changeDemoTask(id: string, changes: DemoChanges) {
    setDemo((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
      revision: state.revision + 1,
    }));
  }
  const [launchOpen, setLaunchOpen] = useState(shouldShowLaunch);
  const finishLaunch = useCallback(() => {
    rememberLaunch();
    setLaunchOpen(false);
  }, []);
  const [page, setPage] = useState<Page>("today");
  const [calendarDate, setCalendarDate] = useState(demoDate);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [chatMode, setChatMode] = useState<ChatMode | null>(() =>
    new URLSearchParams(window.location.search).get("mode") === "demo" ? "demo" : null,
  );
  const [chatStatus, setChatStatus] = useState<"idle" | "sending" | "error">("idle");
  const sending = useRef(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const scrollTimer = useRef<number | null>(null);
  const content = useRef<HTMLElement>(null);

  useEffect(
    () => () => {
      if (scrollTimer.current !== null) window.clearTimeout(scrollTimer.current);
    },
    [],
  );

  function openPage(next: Page) {
    setPage(next);
    setChatOpen(false);
    setScrolling(false);
    if (content.current) content.current.scrollTop = 0;
  }

  function hideComposerOnScroll() {
    setScrolling(true);
    if (scrollTimer.current !== null) window.clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => setScrolling(false), 380);
  }

  async function send() {
    const prompt = draft.trim();
    if (!prompt || sending.current) return;

    const turn: ChatMessage = { role: "user", content: prompt };
    setChatOpen(true);
    sending.current = true;
    if (chatMode !== "demo") setChatStatus("sending");

    try {
      const mode = chatMode ?? (await getChatMode());
      setChatMode(mode);
      const reply =
        mode === "demo" ? demoSummary() : await requestReply([...messages, turn], language);
      setMessages((previous) => [...previous, turn, { role: "assistant", content: reply }]);
      setDraft("");
      setChatStatus("idle");
    } catch {
      setChatStatus("error");
    } finally {
      sending.current = false;
    }
  }

  function demoSummary() {
    const day = demoDayItems(demo.items, demoNow);
    const window = demoWindow(demo.items, demoNow);
    const status = day.filter((item) => item.done).length + " / " + day.length;
    const first = preferences.smartRecommendations
      ? prototypeRecommendations(demo.items, demoNow)[0]
      : undefined;
    const currentTime = formatClock(demoTime, preferences.clock, language);
    const step = first?.title[language];
    return language === "zh"
      ? `11 月 27 日 ${currentTime}，今日进度 ${status}，当前空档 ${window.available} 分钟。${step ? `可以先「${step}」。` : ""}`
      : `November 27, ${currentTime}. Today's progress is ${status}, with ${window.available} minutes free.${step ? ` Try: ${step}.` : ""}`;
  }

  return (
    <div className="app">
      {launchOpen ? <LaunchScreen onDismiss={finishLaunch} /> : null}
      <header className="brand-bar" inert={launchOpen}>
        <button
          className="brand-trigger"
          type="button"
          aria-label={t("openSettings")}
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          aria-controls="settings-drawer"
          onClick={() => setSettingsOpen(true)}
        >
          <img className="brand-logo" src={nowDoLogo} alt="" width={24} height={24} />
        </button>
        <span className="brand-watermark">Tokenow·NowDo</span>
      </header>
      <SettingsDrawer
        open={settingsOpen}
        darkMode={darkMode}
        preferences={preferences}
        setPreference={setPreference}
        onToggleTheme={() => setDarkMode((dark) => !dark)}
        onClose={() => setSettingsOpen(false)}
        onReplay={() => {
          setSettingsOpen(false);
          setLaunchOpen(true);
        }}
      />
      <main
        ref={content}
        className="app-content"
        inert={launchOpen}
        onScrollCapture={hideComposerOnScroll}
        onTouchMove={hideComposerOnScroll}
      >
        <div hidden={page !== "today"}>
          <DemoHome items={demo.items} now={demoNow} preferences={preferences} />
        </div>
        <div hidden={page !== "tasks"}>
          <TasksPanel
            demoItems={demo.items}
            onDemoChange={changeDemoTask}
            clock={preferences.clock}
            showRecoveryFeedback={preferences.recoveryFeedback}
            today={demoNow}
          />
        </div>
        {page === "calendar" ? (
          <CalendarPage
            today={demoNow}
            selectedDate={calendarDate}
            weekStart={preferences.weekStart}
            clock={preferences.clock}
            onSelectDate={setCalendarDate}
            demoItems={demo.items}
          />
        ) : null}
        <div hidden={page !== "insights"}>
          <InsightsPage
            key={preferences.defaultTime}
            defaultTime={preferences.defaultTime}
            count={preferences.recommendationCount}
            enabled={preferences.smartRecommendations}
            source={calendarRecommendations(demo.items, demoNow)}
            revision={demo.revision}
            schedule={
              <DemoScheduleTable items={demo.items} now={demoNow} clock={preferences.clock} />
            }
          />
        </div>
      </main>

      <div className="app-bottom" inert={launchOpen}>
        <div className="agent-dock" data-scrolling={scrolling && !chatOpen}>
          {chatOpen ? (
            <aside
              id="agent-conversation"
              className="agent-conversation"
              aria-label={t("conversation")}
            >
              <div className="agent-conversation-heading">
                <strong>Tokenow·NowDo</strong>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t("closeConversation")}
                  onClick={() => setChatOpen(false)}
                >
                  <AppIcon name="close" />
                </button>
              </div>
              <ChatHistory
                messages={messages}
                pendingMessage={chatStatus === "sending" ? draft.trim() : undefined}
                failed={chatStatus === "error"}
              />
            </aside>
          ) : null}
          <form
            className="agent-form"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <button
              type="button"
              className="icon-button agent-history-button"
              aria-label={t("history")}
              aria-expanded={chatOpen}
              onClick={() => setChatOpen((open) => !open)}
            >
              <AppIcon name="chat" />
            </button>
            <textarea
              aria-label={t("message")}
              placeholder={t(chatMode === "live" ? "livePlaceholder" : "placeholder")}
              readOnly={chatStatus === "sending"}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (isSendShortcut(event)) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <button
              className="agent-send"
              type="submit"
              aria-label={t("send")}
              disabled={chatStatus === "sending" || !draft.trim()}
            >
              <AppIcon name="send" />
            </button>
          </form>
        </div>
        <nav className="bottom-nav" aria-label={t("navigation")}>
          {pages.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              aria-current={page === id ? "page" : undefined}
              onClick={() => openPage(id)}
            >
              <AppIcon name={icon} />
              <span>{t(label)}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
