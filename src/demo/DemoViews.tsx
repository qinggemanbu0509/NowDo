import { AppIcon } from "../AppIcon.tsx";
import { useLanguage } from "../interface-language.tsx";
import { dateFromKey, demoDateKey } from "../dates.ts";
import { energySymbols } from "../insights/copy.ts";
import { formatClock, type ClockFormat, type Preferences } from "../preferences.ts";
import { energyLabels } from "../recovery/copy.ts";
import { isRecoveryOverdue, localized } from "../recovery/model.ts";
import { prototypeRecommendations } from "./recommendations.ts";
import {
  clockLabel,
  demoDayItems,
  demoWindow,
  minuteOfDay,
  prototypeId,
  type DemoItem,
} from "./schedule.ts";

const copy = {
  currentTime: ["当前时间", "Current time"],
  freeWindow: ["日历空档", "Calendar window"],
  todayProgress: ["今日进度", "Today's progress"],
  timeline: ["今日时间线", "Today's timeline"],
  freeTime: ["当前空闲时间", "Current free time"],
  needsAdjustment: ["待调整", "Needs adjustment"],
  recommendations: ["根据当前精力推荐", "Suggestions by energy"],
  openWeek: ["本周任务安排", "This week's schedule"],
  event: ["日程", "Scheduled task"],
  energy: ["精力", "Energy"],
  timeType: ["时间属性", "Time type"],
  fixed: ["固定", "Fixed"],
  flexible: ["灵活", "Flexible"],
} as const;

export function DemoHome({
  items,
  now,
  preferences,
}: {
  items: readonly DemoItem[];
  now: Date;
  preferences: Pick<Preferences, "clock" | "smartRecommendations" | "recoveryFeedback">;
}) {
  const { language, t, fullDateFormat, weekdayFormat } = useLanguage();
  const text = (key: keyof typeof copy) => localized(copy[key], language);
  const day = demoDayItems(items, now);
  const completed = day.filter((item) => item.done).length;
  const { current, next, minute, until, available } = demoWindow(items, now);
  const followUps = preferences.smartRecommendations ? prototypeRecommendations(items, now) : [];
  const showTime = (minutes: number) =>
    formatClock(clockLabel(minutes), preferences.clock, language);
  const prototype = day.find((item) => item.id === prototypeId);
  const pendingPrototype = prototype && !prototype.done && isRecoveryOverdue(prototype, now);
  const displayWindow =
    available !== 0 && available % 60 === 0 ? `${available / 60} h` : `${available} min`;
  const spokenWindow =
    language === "zh"
      ? available % 60 === 0
        ? `${available / 60} 小时`
        : `${available} 分钟`
      : available % 60 === 0
        ? `${available / 60} hours`
        : `${available} minutes`;
  const ordered = [
    ...day.map((item) => ({ start: minuteOfDay(item.schedule!.time!), item })),
    ...(available > 0 ? [{ start: minute, item: null }] : []),
  ].sort((a, b) => a.start - b.start);
  const nextTitle = next && localized(next.title, language);
  const currentTitle = current && localized(current.title, language);
  const analysis = currentTitle
    ? language === "zh"
      ? `当前正在进行「${currentTitle}」。`
      : `“${currentTitle}” is in progress.`
    : nextTitle
      ? language === "zh"
        ? `距离下一项安排「${nextTitle}」还有 ${spokenWindow}。`
        : `There are ${spokenWindow} until “${nextTitle}.”`
      : language === "zh"
        ? "今天的日程已没有其他安排。"
        : "There are no more scheduled activities today.";
  const suggestion =
    preferences.recoveryFeedback && pendingPrototype
      ? language === "zh"
        ? "上午的产品原型测试尚未完成。建议午餐和适当休息后，优先推进测试，为下午的团队复盘做好准备。"
        : "The morning prototype test is still open. After lunch and a short break, make progress on testing before the team review."
      : "";

  return (
    <section className="demo-home" data-clock={preferences.clock} aria-labelledby="demo-home-title">
      <header className="demo-home-header">
        <h1 id="demo-home-title">
          <AppIcon name="sparkles" /> NowDo · AI Insight
        </h1>
        <time dateTime={demoDateKey(now)}>
          {weekdayFormat.format(now)} · {fullDateFormat.format(now)}
        </time>
      </header>
      <dl className="demo-home-stats">
        <div>
          <dt>{text("currentTime")}</dt>
          <dd>{showTime(minute)}</dd>
        </div>
        <div>
          <dt>{text("freeWindow")}</dt>
          <dd>{displayWindow}</dd>
        </div>
        <div>
          <dt>{text("todayProgress")}</dt>
          <dd>
            {completed} / {day.length}
          </dd>
        </div>
      </dl>
      <progress
        className="demo-progress"
        max={day.length || 1}
        value={completed}
        aria-label={text("todayProgress")}
      />
      <section className="demo-home-analysis" aria-labelledby="demo-analysis-title">
        <h2 id="demo-analysis-title">Now·Tips:</h2>
        <p>
          {analysis} {suggestion}
        </p>
      </section>
      <section className="demo-timeline" aria-labelledby="demo-timeline-title">
        <h2 id="demo-timeline-title">{text("timeline")}</h2>
        <ul>
          {ordered.map(({ start, item }) => {
            const status = !item
              ? "now"
              : item.done
                ? "done"
                : isRecoveryOverdue(item, now)
                  ? "overdue"
                  : "todo";
            const end = item ? start + (item.slotMinutes ?? item.minutes ?? 0) : until;
            return (
              <li key={item?.id ?? "now"} data-status={status} data-task-id={item?.id}>
                <span className="demo-timeline-marker" aria-hidden="true">
                  {status === "done" ? "✓" : status === "overdue" ? "!" : ""}
                </span>
                <div>
                  <strong>{item ? localized(item.title, language) : text("freeTime")}</strong>
                  <span>
                    {showTime(start)} – {showTime(end)}
                  </span>
                </div>
                {status === "overdue" && (
                  <span className="demo-timeline-status">{text("needsAdjustment")}</span>
                )}
                {status === "now" && <span className="demo-timeline-status">Now</span>}
              </li>
            );
          })}
        </ul>
      </section>
      {followUps.length > 0 && (
        <section className="demo-home-recommendations" aria-labelledby="demo-recommendation-title">
          <h2 id="demo-recommendation-title">{text("recommendations")}</h2>
          <ul>
            {followUps.map((step) => (
              <li key={step.id}>
                <div>
                  <span>
                    {energySymbols[step.energy]} {localized(energyLabels[step.energy], language)}
                  </span>
                  <strong>{step.title[language]}</strong>
                </div>
                <span>
                  {step.minutes} {t("minute")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export function DemoScheduleTable({
  items,
  now,
  clock,
}: {
  items: readonly DemoItem[];
  now: Date;
  clock: ClockFormat;
}) {
  const { language, t, weekdayFormat } = useLanguage();
  const text = (key: keyof typeof copy) => localized(copy[key], language);
  const visible = items
    .filter((item) => !item.archived)
    .sort((a, b) => {
      const left = `${a.schedule?.date}T${a.schedule?.time ?? ""}`;
      const right = `${b.schedule?.date}T${b.schedule?.time ?? ""}`;
      return left.localeCompare(right);
    });
  return (
    <details className="demo-schedule-table">
      <summary>
        {text("openWeek")} <span>{visible.length}</span>
      </summary>
      <div tabIndex={0} role="region" aria-label={text("openWeek")}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>{t("dateRange")}</th>
              <th>{text("event")}</th>
              <th>{t("estimate")}</th>
              <th>{text("energy")}</th>
              <th>{text("timeType")}</th>
              <th>{t("taskStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => {
              const schedule = item.schedule!;
              const start = minuteOfDay(schedule.time!);
              const status = item.done ? "done" : isRecoveryOverdue(item, now) ? "overdue" : "todo";
              return (
                <tr key={item.id} data-task-id={item.id} data-status={status}>
                  <td>{item.id}</td>
                  <td>
                    <time dateTime={`${schedule.date}T${schedule.time}`}>
                      {weekdayFormat.format(dateFromKey(schedule.date))}{" "}
                      {formatClock(schedule.time!, clock, language)}–
                      {formatClock(
                        clockLabel(start + (item.slotMinutes ?? item.minutes ?? 0)),
                        clock,
                        language,
                      )}
                    </time>
                  </td>
                  <td>{localized(item.title, language)}</td>
                  <td>
                    {item.minutes} {t("minute")}
                  </td>
                  <td>
                    {item.energy
                      ? `${energySymbols[item.energy]} ${localized(energyLabels[item.energy], language)}`
                      : t("unset")}
                  </td>
                  <td>{text(item.fixed ? "fixed" : "flexible")}</td>
                  <td>{t(status)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
}
