import { useEffect, useRef, type CSSProperties } from "react";
import { AppIcon } from "./AppIcon.tsx";
import {
  categoryLabels,
  clockLabel,
  demoDate,
  minuteOfDay,
  type DemoCategory,
  type DemoItem,
} from "./demo/schedule.ts";
import { isRecoveryOverdue, localized } from "./recovery/model.ts";
import { formatClock, type Preferences } from "./preferences.ts";
import { useLanguage } from "./interface-language.tsx";
import { addDays, dateFromKey, demoDateKey, mondayOf } from "./dates.ts";

type TimelineEvent = {
  key: string;
  title: string;
  label: string;
  start: number;
  end: number;
  kind: DemoCategory;
  detail?: string;
  done?: boolean;
  overdue?: boolean;
};

function placeEvents(events: TimelineEvent[]) {
  let groupEnd = -1;
  let laneEnds: number[] = [];
  return events
    .toSorted((left, right) => left.start - right.start)
    .map((event) => {
      if (event.start >= groupEnd) laneEnds = [];
      groupEnd = Math.max(groupEnd, event.end);
      const freeLane = laneEnds.findIndex((end) => end <= event.start);
      const lane = freeLane === -1 ? laneEnds.length : freeLane;
      laneEnds[lane] = event.end;
      return { event, lane, laneEnds };
    });
}

interface CalendarPageProps {
  today: Date;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  demoItems: readonly DemoItem[];
  weekStart: Preferences["weekStart"];
  clock: Preferences["clock"];
}

export function CalendarPage({
  today,
  selectedDate,
  onSelectDate,
  demoItems,
  weekStart,
  clock,
}: CalendarPageProps) {
  const { language, t, fullDateFormat, weekdayFormat } = useLanguage();
  const viewport = useRef<HTMLDivElement>(null);
  const day = dateFromKey(selectedDate);
  const todayKey = demoDateKey(today);
  const first = weekStart === "sunday" ? addDays(day, -day.getUTCDay()) : mondayOf(day);
  const showTime = (minutes: number) => formatClock(clockLabel(minutes), clock, language);
  const dates = Array.from({ length: 7 }, (_, index) => addDays(first, index));
  const columns = dates.map((date) => {
    const key = demoDateKey(date);
    const events = demoItems.flatMap((item): TimelineEvent[] => {
      const schedule = item.schedule;
      if (item.archived || schedule?.date !== key || !schedule.time) return [];
      const start = minuteOfDay(schedule.time);
      const end = Math.min(24 * 60, start + (item.slotMinutes ?? item.minutes ?? 0));
      return [
        {
          key: item.id,
          title: localized(item.title, language),
          label: `${showTime(start)}–${showTime(end)}`,
          start,
          end,
          kind: item.category,
          detail: item.location && localized(item.location, language),
          done: item.done,
          overdue: !item.done && isRecoveryOverdue(item, today),
        },
      ];
    });
    return { key, date, events };
  });
  let startHour = 7;
  let endHour = 23;
  for (const { events } of columns) {
    for (const event of events) {
      startHour = Math.min(startHour, Math.floor(event.start / 60));
      endHour = Math.max(endHour, Math.ceil(event.end / 60));
    }
  }
  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  function timelineOffset(minutes: number): string {
    return String((minutes / (hours.length * 60)) * 100) + "%";
  }

  useEffect(() => {
    const grid = viewport.current;
    const anchor = grid?.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`);
    const gutter = grid?.querySelector<HTMLElement>(".calendar-corner");
    if (!grid || !anchor || !gutter) return;
    grid.scrollLeft +=
      anchor.getBoundingClientRect().left - grid.getBoundingClientRect().left - gutter.offsetWidth;
  }, [selectedDate, weekStart]);

  function switchWeek(by: number) {
    onSelectDate(demoDateKey(addDays(day, by * 7)));
  }

  return (
    <section className="calendar-page" aria-labelledby="calendar-title">
      <header className="page-title">
        <h1 id="calendar-title">{t("navCalendar")}</h1>
        <div className="calendar-shortcuts">
          <button className="secondary-button" type="button" onClick={() => onSelectDate(demoDate)}>
            {t("backToThisWeek")}
          </button>
        </div>
      </header>
      <div className="calendar-week-nav" role="group" aria-label={t("changeWeek")}>
        <button
          className="icon-button"
          type="button"
          aria-label={t("previousWeek")}
          onClick={() => switchWeek(-1)}
        >
          <AppIcon name="left" />
        </button>
        <p>
          {fullDateFormat.format(first)} – {fullDateFormat.format(dates[6])}
        </p>
        <button
          className="icon-button"
          type="button"
          aria-label={t("nextWeek")}
          onClick={() => switchWeek(1)}
        >
          <AppIcon name="right" />
        </button>
      </div>

      <ul className="calendar-legend">
        {Object.entries(categoryLabels).map(([kind, label]) => (
          <li key={kind} data-kind={kind}>
            {localized(label, language)}
          </li>
        ))}
      </ul>
      <div
        className="calendar-scroll"
        data-clock={clock}
        ref={viewport}
        tabIndex={0}
        role="region"
        aria-label={t("weekCalendar")}
      >
        <div
          className="calendar-grid"
          style={{ "--calendar-hours": hours.length } as CSSProperties}
        >
          <div className="calendar-row calendar-day-headers">
            <span className="calendar-corner" aria-hidden="true" />
            {columns.map(({ key, date }) => (
              <div
                key={key}
                className="calendar-day-heading"
                data-date={key}
                aria-current={key === todayKey ? "date" : undefined}
              >
                <span>{weekdayFormat.format(date)}</span>
                <time dateTime={key}>{fullDateFormat.format(date)}</time>
              </div>
            ))}
          </div>

          <div className="calendar-row calendar-timeline">
            <div className="calendar-gutter calendar-time-labels" aria-hidden="true">
              {hours.map((hour) => (
                <span key={hour}>{showTime(hour * 60)}</span>
              ))}
            </div>
            {columns.map(({ key, date, events }) => (
              <div
                key={key}
                className="calendar-day-column"
                data-today={key === todayKey}
                aria-label={`${fullDateFormat.format(date)} · ${t("navCalendar")}`}
              >
                {placeEvents(events).map(({ event, lane, laneEnds }) => {
                  const width = 100 / laneEnds.length;
                  return (
                    <article
                      key={event.key}
                      className="calendar-event"
                      data-task-id={event.key}
                      data-kind={event.kind}
                      data-done={event.done}
                      data-status={event.done ? "done" : event.overdue ? "overdue" : "todo"}
                      style={{
                        insetBlockStart: timelineOffset(event.start - startHour * 60),
                        blockSize: timelineOffset(event.end - event.start),
                        insetInlineStart: "calc(" + width * lane + "% + 3px)",
                        inlineSize: "calc(" + width + "% - 6px)",
                      }}
                      title={
                        event.label +
                        " " +
                        event.title +
                        (event.detail ? " · " + event.detail : "") +
                        (" · " + t(event.done ? "done" : event.overdue ? "overdue" : "todo"))
                      }
                    >
                      <span>{event.label}</span>
                      <strong>{event.title}</strong>
                      {event.detail ? <small>{event.detail}</small> : null}
                      {event.overdue && (
                        <small className="calendar-overdue">
                          {language === "zh" ? "待调整" : "Needs adjustment"}
                        </small>
                      )}
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
