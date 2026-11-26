import { useEffect, useRef, useState } from "react";
import { AppIcon } from "../AppIcon.tsx";
import type { ReactNode } from "react";
import { useLanguage } from "../interface-language.tsx";
import { energySymbols, getInsightsCopy, recommendationReason } from "./copy.ts";
import type { InsightEnergy, InsightTask } from "./types.ts";
import {
  createRecommendationList,
  energyLevels,
  replaceRecommendation,
  timePresets,
  type RecommendationCriteria,
  type RecommendationSource,
} from "./recommendations.ts";

type InsightsCopy = ReturnType<typeof getInsightsCopy>;
type TimeChoice = (typeof timePresets)[number] | "custom";

export function InsightsPage({
  source,
  revision = 0,
  schedule,
  defaultTime = 30,
  count = 3,
  enabled = true,
}: {
  source: RecommendationSource;
  revision?: number;
  schedule?: ReactNode;
  defaultTime?: (typeof timePresets)[number];
  count?: number;
  enabled?: boolean;
}) {
  const { language } = useLanguage();
  const labels = getInsightsCopy(language);
  const [timeChoice, setTimeChoice] = useState<TimeChoice>(defaultTime);
  const [customTime, setCustomTime] = useState("45");
  const [energy, setEnergy] = useState<InsightEnergy>("medium");
  const minutes = timeChoice === "custom" ? Number(customTime) : timeChoice;
  const validTime = Number.isSafeInteger(minutes) && minutes > 0;

  return (
    <section className="insights-page" aria-labelledby="insights-title">
      <header className="page-title">
        <h1 id="insights-title">{labels.title}</h1>
      </header>
      {schedule}
      {enabled && (
        <div className="insights-controls">
          <fieldset>
            <legend>{labels.time}</legend>
            <div className="insights-times">
              {timePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={timeChoice === preset}
                  onClick={() => setTimeChoice(preset)}
                >
                  {preset < 60 ? `${preset} ${labels.minutes}` : `${preset / 60} ${labels.hours}`}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={timeChoice === "custom"}
                onClick={() => setTimeChoice("custom")}
              >
                {labels.custom}
              </button>
            </div>
            {timeChoice === "custom" && (
              <div className="insights-custom">
                <label htmlFor="insights-custom-minutes">{labels.customMinutes}</label>
                <input
                  id="insights-custom-minutes"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={customTime}
                  aria-invalid={!validTime}
                  aria-describedby={validTime ? undefined : "insights-time-error"}
                  onChange={(event) => setCustomTime(event.currentTarget.value)}
                />
                {!validTime && (
                  <p id="insights-time-error" role="status">
                    {labels.invalidMinutes}
                  </p>
                )}
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend>{labels.energy}</legend>
            <div className="insights-energies">
              {energyLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={energy === level}
                  onClick={() => setEnergy(level)}
                >
                  <span aria-hidden="true">{energySymbols[level]}</span>
                  <strong>{labels.energyNames[level]}</strong>
                  <small>{labels.energyShort[level]}</small>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}
      {!enabled && (
        <p className="page-empty insights-paused">
          {language === "zh"
            ? "智能任务推荐已关闭，可在设置中开启。"
            : "Smart recommendations are off. Turn them on in Settings."}
        </p>
      )}

      {enabled && validTime && (
        <Recommendations
          key={`${revision}-${timeChoice}-${minutes}-${energy}-${count}`}
          criteria={{ minutes, energy }}
          source={source}
          count={count}
        />
      )}
    </section>
  );
}

function Recommendations({
  criteria,
  source,
  count,
}: {
  criteria: RecommendationCriteria;
  count: number;
  source: RecommendationSource;
}) {
  const { language } = useLanguage();
  const labels = getInsightsCopy(language);
  const [candidates] = useState(() => source.getCandidates(criteria));
  const [list, setList] = useState(() => createRecommendationList(candidates, count));
  const [started, setStarted] = useState<InsightTask | null>(null);

  return (
    <section className="insights-results" aria-labelledby="insights-recommendations">
      <header className="insights-results-heading">
        <h2 id="insights-recommendations">{labels.recommended}</h2>
        <span>{labels.count(list.shown.length)}</span>
      </header>
      {!list.shown.length && (
        <p className="page-empty">
          {language === "zh"
            ? "这段空档没有符合条件的任务。试试更长的时间或不同的精力状态。"
            : "No tasks fit this window. Try more time or a different energy level."}
        </p>
      )}
      <ul className="insights-cards">
        {list.shown.map((task, slot) => (
          <li
            className="insights-card"
            data-source-id={task.sourceId}
            data-featured={slot === 0}
            key={slot}
          >
            <div className="insights-card-content" aria-live="polite">
              <div key={task.id} className="insights-card-details">
                <div className="insights-card-heading">
                  <span>
                    {labels.categories[task.category]}
                    {task.sourceId && ` · ${task.sourceId}`}
                  </span>
                  {slot === 0 && <span className="insights-featured">{labels.featured}</span>}
                </div>
                <h3>{task.title[language]}</h3>
                <div className="insights-task-meta">
                  <span>
                    {task.minutes} {labels.minutes}
                  </span>
                  <span>
                    <span aria-hidden="true">{energySymbols[task.energy]} </span>
                    {labels.energyNames[task.energy]}
                  </span>
                  <span data-priority={task.priority}>{labels.priorities[task.priority]}</span>
                </div>
                <p>{recommendationReason(task, criteria, labels)}</p>
              </div>
            </div>
            <div className="insights-card-actions">
              <button className="insights-start" type="button" onClick={() => setStarted(task)}>
                <AppIcon name="play" />
                {labels.start}
              </button>
              <button
                className="insights-swap"
                type="button"
                disabled={candidates.length <= list.shown.length}
                onClick={() => setList(replaceRecommendation(list, slot, candidates))}
              >
                <span aria-hidden="true">↻</span>
                {labels.swap}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <StartFeedback task={started} labels={labels} onClose={() => setStarted(null)} />
    </section>
  );
}

function StartFeedback({
  task,
  labels,
  onClose,
}: {
  task: InsightTask | null;
  labels: InsightsCopy;
  onClose: () => void;
}) {
  const { language } = useLanguage();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (task && dialog && !dialog.open) dialog.showModal();
  }, [task]);

  return (
    <dialog
      ref={ref}
      className="insights-feedback"
      aria-labelledby="insights-started-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="insights-feedback-body">
        <AppIcon name="check" />
        <h2 id="insights-started-title">{labels.started}</h2>
        <p>{task?.title[language]}</p>
        {task && (
          <span>
            {task.minutes} {labels.minutes}
          </span>
        )}
        <form method="dialog">
          <button className="insights-start" type="submit">
            {labels.back}
          </button>
        </form>
      </div>
    </dialog>
  );
}
