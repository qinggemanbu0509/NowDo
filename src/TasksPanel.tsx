import { useState } from "react";
import { taskPriorities } from "../shared/tasks.ts";
import { AppIcon } from "./AppIcon.tsx";
import { addDays, demoDateKey } from "./dates.ts";
import { formatClock, type ClockFormat } from "./preferences.ts";
import { useLanguage } from "./interface-language.tsx";
import { energyLabels, labels as recoveryLabels, reasonCopy } from "./recovery/copy.ts";
import { clockLabel, minuteOfDay, type DemoChanges, type DemoItem } from "./demo/schedule.ts";
import {
  isRecoveryOverdue,
  localized,
  type RecoveryChanges,
  type RecoveryTask,
} from "./recovery/model.ts";
import { RecoveryDeadline, RecoveryDialog, RecoverySteps } from "./recovery/RecoveryDialog.tsx";
import { mockRecoverySource } from "./recovery/suggestions.ts";

const periodOptions = [
  ["overdue", "overdue"],
  ["today", "todayTasks"],
  ["week", "nextSeven"],
  ["later", "later"],
  ["unscheduled", "noDate"],
] as const;

const todoPeriods = periodOptions.filter(([key]) => key !== "overdue");

type Period = (typeof periodOptions)[number][0];
type PeriodSelection = Period | "all";

function splitByPeriod(items: readonly DemoItem[], now: Date, today: string, weekEnd: string) {
  const sections: Record<Period, DemoItem[]> = {
    overdue: [],
    today: [],
    week: [],
    later: [],
    unscheduled: [],
  };
  for (const item of items) {
    if (item.archived) continue;
    const plannedDate = item.schedule?.date;
    let period: Period = "unscheduled";
    if (isRecoveryOverdue(item, now)) period = "overdue";
    else if (plannedDate === today) period = "today";
    else if (plannedDate) period = plannedDate <= weekEnd ? "week" : "later";
    sections[period].push(item);
  }
  return sections;
}

function TaskRow({
  item,
  clock,
  today,
  onChange,
  onRecover,
  showMissedReason,
}: {
  item: DemoItem;
  clock: ClockFormat;
  today: string;
  onChange: (id: string, changes: DemoChanges) => void;
  onRecover: (id: string) => void;
  showMissedReason: boolean;
}) {
  const { language, t } = useLanguage();
  const { id, priority, done, schedule, slotMinutes } = item;
  const title = localized(item.title, language);
  const start = schedule?.time;

  return (
    <li className="task-row" data-task-id={id} data-done={done} data-priority={priority}>
      <div className="task-row-heading">
        <div className="task-row-name">
          {done ? (
            <span className="task-row-status" aria-hidden="true">
              ✓
            </span>
          ) : (
            <button
              className="task-row-status task-complete-trigger"
              type="button"
              aria-label={language === "zh" ? `完成「${title}」` : `Complete “${title}”`}
              onClick={() => onChange(id, { done: true })}
            />
          )}
          <p>{title}</p>
        </div>
      </div>
      <div className="task-row-details">
        <span>{localized(recoveryLabels.schedule, language)}</span>
        {schedule ? (
          <time dateTime={start ? schedule.date + "T" + start : schedule.date}>
            {schedule.date} {start && formatClock(start, clock, language)}
            {start && slotMinutes
              ? `–${formatClock(clockLabel(minuteOfDay(start) + slotMinutes), clock, language)}`
              : ""}
          </time>
        ) : (
          <span>{t("noDate")}</span>
        )}
        {done ? (
          priority && (
            <span className={`task-priority task-priority--${priority}`}>{t(priority)}</span>
          )
        ) : (
          <span className="task-priority-picker">
            <select
              className={`task-priority task-priority--${priority ?? "unset"}`}
              aria-label={`${t("priority")} · ${title}`}
              value={priority ?? ""}
              onChange={(event) => {
                const value = event.currentTarget.value;
                const next = taskPriorities.find((level) => level === value) ?? null;
                onChange(id, { priority: next });
              }}
            >
              <option value="">{t("noPriority")}</option>
              {taskPriorities.map((level) => (
                <option key={level} value={level}>
                  {t(level)}
                </option>
              ))}
            </select>
          </span>
        )}
        {item.minutes != null && (
          <span>
            {item.minutes} {t("minute")}
          </span>
        )}
        {item.energy && (
          <span>
            {localized(recoveryLabels.energy, language)} ·{" "}
            {localized(energyLabels[item.energy], language)}
          </span>
        )}
      </div>
      {!done && (
        <div className="recovery-row-details">
          {showMissedReason && item.missedReason && (
            <p className="task-missed-reason">
              {localized(recoveryLabels.missedReason, language)}
              <strong>{localized(reasonCopy[item.missedReason].title, language)}</strong>
            </p>
          )}
          <RecoveryDeadline task={item} today={today} />
          <RecoverySteps task={item} />
          <button
            className="secondary-button recovery-row-action"
            type="button"
            onClick={() => onRecover(id)}
          >
            <span aria-hidden="true">↻</span> {localized(recoveryLabels.adjust, language)}
          </button>
        </div>
      )}
    </li>
  );
}

function TaskEmptyState({ children }: { children: string }) {
  return (
    <div className="task-empty">
      <span className="task-empty-icon" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

interface TasksPanelProps {
  demoItems: readonly DemoItem[];
  clock: ClockFormat;
  showRecoveryFeedback: boolean;
  onDemoChange: (id: string, changes: DemoChanges) => void;
  today: Date;
}

type TaskView = "todo" | "done" | "overdue";
type RecoveryFeedback = "success" | "archived" | "restored";

export function TasksPanel({
  demoItems,
  clock,
  showRecoveryFeedback,
  onDemoChange,
  today,
}: TasksPanelProps) {
  const { language, t, fullDateFormat } = useLanguage();
  const [active, setActive] = useState<TaskView>("todo");
  const [period, setPeriod] = useState<PeriodSelection>("all");
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: RecoveryFeedback;
    viewTodo?: boolean;
  } | null>(null);

  const todayKey = demoDateKey(today);
  const weekKey = demoDateKey(addDays(today, 7));
  const completed = demoItems.filter((task) => task.done && !task.archived);
  const pending = demoItems.filter((task) => !task.done);
  const archived = pending.filter((task) => task.archived);
  const openTask = pending.find((task) => task.id === recoveryId);
  const sections = splitByPeriod(pending, today, todayKey, weekKey);
  const todoCount = todoPeriods.reduce((total, [key]) => total + sections[key].length, 0);
  const tabs = [
    { key: "todo", label: "todo", count: todoCount },
    { key: "done", label: "done", count: completed.length },
    { key: "overdue", label: "overdue", count: sections.overdue.length },
  ] as const;
  const visible = todoPeriods.filter(
    ([key]) => (period === "all" || period === key) && sections[key].length > 0,
  );

  function applyRecovery(task: RecoveryTask, changes: RecoveryChanges) {
    const updated = { ...task, ...changes };
    onDemoChange(task.id, changes);
    setFeedback({
      message: updated.archived ? "archived" : "success",
      viewTodo: active === "overdue" && !updated.archived && !isRecoveryOverdue(updated, today),
    });
  }

  function restoreArchived(id: string) {
    onDemoChange(id, { archived: false });
    setFeedback({ message: "restored" });
  }

  function renderRows(items: readonly DemoItem[]) {
    return (
      <ul className="task-items">
        {items.map((item) => (
          <TaskRow
            key={item.id}
            item={item}
            today={todayKey}
            clock={clock}
            onChange={onDemoChange}
            onRecover={setRecoveryId}
            showMissedReason={active === "overdue"}
          />
        ))}
      </ul>
    );
  }

  return (
    <section id="tasks-panel" className="task-panel" aria-labelledby="tasks-title">
      <header className="page-title">
        <h1 id="tasks-title">{t("navTasks")}</h1>
        <time dateTime={todayKey}>{fullDateFormat.format(today)}</time>
      </header>
      <div className="task-menu" role="group" aria-label={t("taskStatus")}>
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            aria-pressed={active === key}
            onClick={() => setActive(key)}
          >
            {t(label)}
            <span>{count}</span>
          </button>
        ))}
      </div>
      {active === "todo" && (
        <label className="task-range">
          <span className="task-range-label">
            <span className="task-range-icon">
              <AppIcon name="calendar" />
            </span>
            {t("dateRange")}
          </span>
          <span className="task-range-choice">
            <select
              value={period}
              onChange={(event) => setPeriod(event.currentTarget.value as PeriodSelection)}
            >
              <option value="all">{t("allTasks")}</option>
              {todoPeriods.map(([key, label]) => (
                <option key={key} value={key}>
                  {t(label)}
                </option>
              ))}
            </select>
          </span>
        </label>
      )}
      <div className="task-panel-body">
        {feedback && (
          <div className="recovery-feedback">
            <p role="status">{localized(recoveryLabels[feedback.message], language)}</p>
            {feedback.viewTodo && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setActive("todo");
                  setPeriod("all");
                  setFeedback({ message: "success" });
                }}
              >
                {localized(recoveryLabels.viewTodo, language)}
              </button>
            )}
          </div>
        )}
        {!!archived.length && (
          <section className="recovery-archive" aria-labelledby="recovery-archive-title">
            <h2 id="recovery-archive-title">{localized(recoveryLabels.archivedTasks, language)}</h2>
            <ul>
              {archived.map((recovery) => (
                <li key={recovery.id}>
                  <div>
                    <p>{localized(recovery.title, language)}</p>
                    <RecoveryDeadline task={recovery} today={todayKey} />
                  </div>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => restoreArchived(recovery.id)}
                  >
                    {localized(recoveryLabels.undo, language)}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {active === "overdue" ? (
          sections.overdue.length ? (
            renderRows(sections.overdue.toReversed())
          ) : (
            <TaskEmptyState>{t("noOverdue")}</TaskEmptyState>
          )
        ) : active === "done" ? (
          completed.length ? (
            renderRows(completed)
          ) : (
            <TaskEmptyState>{t("noCompleted")}</TaskEmptyState>
          )
        ) : visible.length ? (
          visible.map(([key, label]) => (
            <section key={key} className="task-section" data-period={key}>
              <h2>{t(label)}</h2>
              {renderRows(sections[key])}
            </section>
          ))
        ) : (
          <TaskEmptyState>{period === "all" ? t("emptyTasks") : t("emptyRange")}</TaskEmptyState>
        )}
      </div>
      {openTask && (
        <RecoveryDialog
          key={openTask.id}
          task={openTask}
          now={today}
          source={mockRecoverySource}
          initialReason={active === "overdue" ? openTask.missedReason : undefined}
          clock={clock}
          showFeedback={showRecoveryFeedback}
          onClose={() => setRecoveryId(null)}
          onApply={applyRecovery}
        />
      )}
    </section>
  );
}
