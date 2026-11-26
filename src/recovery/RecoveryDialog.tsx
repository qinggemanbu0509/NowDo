import { useEffect, useRef, useState } from "react";
import { readDueDate, readStartTime } from "../../shared/scheduling.ts";
import { AppIcon } from "../AppIcon.tsx";
import { addDays, demoDateKey } from "../dates.ts";
import { formatClock, type ClockFormat } from "../preferences.ts";
import type { Language } from "../../shared/language.ts";
import { useLanguage } from "../interface-language.tsx";
import { clockLabel, demoDate, minuteOfDay, prototypeId } from "../demo/schedule.ts";
import { actionCopy, energyLabels, labels, reasonCopy } from "./copy.ts";
import {
  deadlineRisk,
  isPlanMissed,
  localized,
  type RecoveryChanges,
  type RecoveryTask,
} from "./model.ts";
import {
  recoveryReasons,
  type RecoveryReason,
  type RecoverySuggestionSource,
} from "./suggestions.ts";

export function RecoveryDeadline({
  task,
  today,
  onlyRisk = false,
}: {
  task: RecoveryTask;
  today: string;
  onlyRisk?: boolean;
}) {
  const { language } = useLanguage();
  const risk = deadlineRisk(task, today);
  if (!task.deadline || (onlyRisk && !risk)) return null;

  return (
    <p className="recovery-deadline" data-risk={risk !== null}>
      <span>
        {localized(labels.deadline, language)} <time dateTime={task.deadline}>{task.deadline}</time>
      </span>
      {risk && <span>{localized(labels[risk], language)}</span>}
    </p>
  );
}

export function RecoverySteps({ task }: { task: RecoveryTask }) {
  const { language } = useLanguage();
  return (
    <>
      {!!task.steps?.length && (
        <div className="recovery-steps">
          <p>{localized(labels.steps, language)}</p>
          <ol>
            {task.steps.map((step) => (
              <li key={step[0]}>{localized(step, language)}</li>
            ))}
          </ol>
        </div>
      )}
      {task.nextStep && (
        <p className="recovery-next-step">
          <strong>{localized(labels.nextStep, language)}</strong>{" "}
          {localized(task.nextStep, language)}
        </p>
      )}
    </>
  );
}

function scheduleText(task: RecoveryTask, unset: string, clock: ClockFormat, language: Language) {
  const { schedule, slotMinutes } = task;
  if (!schedule) return unset;
  if (!schedule.time) return schedule.date;
  const end = slotMinutes
    ? `–${formatClock(clockLabel(minuteOfDay(schedule.time) + slotMinutes), clock, language)}`
    : "";
  return `${schedule.date} ${formatClock(schedule.time, clock, language)}${end}`;
}

function TaskSnapshot({
  task,
  title,
  workBlock = false,
  clock,
}: {
  task: RecoveryTask;
  title: string;
  workBlock?: boolean;
  clock: ClockFormat;
}) {
  const { language, t } = useLanguage();
  return (
    <div className="recovery-snapshot">
      <p>{title}</p>
      <strong>{localized(task.title, language)}</strong>
      <dl>
        <div>
          <dt>{localized(labels.schedule, language)}</dt>
          <dd>{scheduleText(task, t("noDate"), clock, language)}</dd>
        </div>
        <div>
          <dt>{localized(workBlock ? labels.block : labels.duration, language)}</dt>
          <dd>{task.minutes === null ? t("unset") : `${task.minutes} ${t("minute")}`}</dd>
        </div>
        <div>
          <dt>{localized(labels.energy, language)}</dt>
          <dd>{task.energy ? localized(energyLabels[task.energy], language) : t("unset")}</dd>
        </div>
        <div>
          <dt>{t("priority")}</dt>
          <dd>{t(task.priority ?? "unset")}</dd>
        </div>
      </dl>
      {task.archived && (
        <p className="recovery-archive-preview">{localized(labels.archived, language)}</p>
      )}
    </div>
  );
}

interface RecoveryDialogProps {
  task: RecoveryTask;
  now: Date;
  source: RecoverySuggestionSource;
  initialReason?: RecoveryReason;
  clock: ClockFormat;
  showFeedback: boolean;
  onApply: (task: RecoveryTask, changes: RecoveryChanges) => void;
  onClose: () => void;
}

export function RecoveryDialog({
  task,
  now,
  source,
  initialReason,
  clock,
  showFeedback,
  onApply,
  onClose,
}: RecoveryDialogProps) {
  const { language } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<RecoveryReason | null>(initialReason ?? null);
  const [option, setOption] = useState(0);
  const [note, setNote] = useState("");
  const [next, setNext] = useState(() =>
    task.id === prototypeId
      ? { date: demoDate, time: "13:00" }
      : { date: demoDateKey(addDays(now, 1)), time: "18:00" },
  );
  const today = demoDateKey(now);
  const suggestions = reason ? source.getSuggestions(task, reason, next) : [];
  const suggestion = suggestions[option];
  const preview = suggestion ? { ...task, ...suggestion.changes } : null;
  const changesSchedule = !!suggestion?.changes.schedule;
  const validSchedule =
    !!readDueDate(next.date) &&
    !!readStartTime(next.time) &&
    !isPlanMissed(next, now) &&
    minuteOfDay(next.time) + (task.slotMinutes ?? 0) <= 24 * 60;

  useEffect(() => {
    const panel = dialog.current;
    if (panel && !panel.open) panel.showModal();
  }, []);

  function apply() {
    if (!suggestion || (changesSchedule && !validSchedule)) return;
    onApply(task, suggestion.changes);
    dialog.current?.close();
  }

  return (
    <dialog
      ref={dialog}
      className="recovery-dialog"
      aria-labelledby="recovery-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="recovery-dialog-body">
        <header className="recovery-dialog-header">
          <h2 id="recovery-title">
            <span aria-hidden="true">↻</span> Smart Recovery
          </h2>
          <button
            className="icon-button"
            type="button"
            aria-label={localized(labels.close, language)}
            onClick={() => dialog.current?.close()}
          >
            <AppIcon name="close" />
          </button>
        </header>

        <div className="recovery-body">
          <p className="recovery-intro">{localized(labels.introduction, language)}</p>
          <p className="recovery-local">{localized(labels.local, language)}</p>
          <div className="recovery-original">
            <TaskSnapshot task={task} title={localized(labels.original, language)} clock={clock} />
            <RecoveryDeadline task={task} today={today} />
          </div>

          <fieldset className="recovery-reasons">
            <legend>{localized(labels.reasons, language)}</legend>
            <div className="recovery-reason-grid">
              {recoveryReasons.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={reason === item}
                  onClick={() => {
                    if (item !== reason) {
                      setReason(item);
                      setOption(0);
                    }
                  }}
                >
                  <span aria-hidden="true">{reasonCopy[item].icon}</span>
                  <span>
                    <strong>{localized(reasonCopy[item].title, language)}</strong>
                    <small>{localized(reasonCopy[item].hint, language)}</small>
                  </span>
                </button>
              ))}
            </div>
            {reason === "other" && (
              <label className="recovery-note">
                {localized(labels.optional, language)}
                <textarea
                  rows={2}
                  maxLength={300}
                  value={note}
                  onChange={(event) => setNote(event.currentTarget.value)}
                />
              </label>
            )}
          </fieldset>

          {reason && suggestion && preview && (
            <section className="recovery-proposal" aria-labelledby="recovery-proposal-title">
              <header>
                <h3 id="recovery-proposal-title">{localized(labels.recommended, language)}</h3>
                <span aria-live="polite">
                  {option + 1} / {suggestions.length}
                </span>
              </header>
              {showFeedback && (
                <p className="recovery-reason-feedback">
                  {localized(reasonCopy[reason].feedback, language)}
                </p>
              )}
              <div className="recovery-suggestion-content" key={`${reason}-${option}`}>
                <h4>
                  {localized(suggestion.heading ?? actionCopy[suggestion.action].title, language)}
                </h4>
                {!suggestion.heading && (
                  <p>{localized(actionCopy[suggestion.action].description, language)}</p>
                )}
                {changesSchedule && (
                  <div className="recovery-schedule-fields task-editor">
                    <label>
                      {localized(labels.newDate, language)}
                      <input
                        type="date"
                        min={today}
                        max="9999-12-31"
                        value={next.date}
                        onChange={(event) => setNext({ ...next, date: event.currentTarget.value })}
                      />
                    </label>
                    <label>
                      {localized(labels.newTime, language)}
                      <input
                        type="time"
                        value={next.time}
                        onChange={(event) => setNext({ ...next, time: event.currentTarget.value })}
                      />
                    </label>
                    {!validSchedule && (
                      <p role="status">{localized(labels.invalidSchedule, language)}</p>
                    )}
                  </div>
                )}
                <div className="recovery-comparison">
                  <TaskSnapshot
                    task={task}
                    title={localized(labels.before, language)}
                    clock={clock}
                  />
                  <TaskSnapshot
                    task={preview}
                    clock={clock}
                    title={localized(labels.after, language)}
                    workBlock={suggestion.action === "split"}
                  />
                </div>
                <RecoverySteps task={preview} />
                <RecoveryDeadline task={preview} today={today} onlyRisk />
              </div>
              <div className="recovery-actions">
                <button
                  className="secondary-button recovery-apply"
                  type="button"
                  onClick={apply}
                  disabled={changesSchedule && !validSchedule}
                >
                  <AppIcon name="check" /> {localized(labels.apply, language)}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={suggestions.length < 2}
                  onClick={() => setOption((option + 1) % suggestions.length)}
                >
                  <span aria-hidden="true">↻</span> {localized(labels.alternate, language)}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </dialog>
  );
}
