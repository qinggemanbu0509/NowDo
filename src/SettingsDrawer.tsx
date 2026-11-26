import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { AppIcon } from "./AppIcon.tsx";
import { useLanguage } from "./interface-language.tsx";
import { nowDoLogo } from "./LaunchScreen.tsx";
import {
  clockOptions,
  defaultTimeOptions,
  preferenceLevels,
  recommendationCounts,
  reminderOptions,
  weekStartOptions,
  type Preferences,
  type SetPreference,
} from "./preferences.ts";
import { biasLevels, paceLevels, settingsCopy as copy } from "./settings-copy.ts";

interface SettingsDrawerProps {
  open: boolean;
  darkMode: boolean;
  preferences: Preferences;
  setPreference: SetPreference;
  onToggleTheme: () => void;
  onClose: () => void;
  onReplay: () => void;
}

type IconName = ComponentProps<typeof AppIcon>["name"];

function SettingsSection({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: IconName;
  children: ReactNode;
}) {
  return (
    <section className="settings-section" aria-labelledby={id}>
      <h3 id={id}>
        <span className="settings-section-icon">
          <AppIcon name={icon} />
        </span>
        {title}
      </h3>
      <div className="settings-card">{children}</div>
    </section>
  );
}

function SettingsToggle({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="settings-row"
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
    >
      <span>{label}</span>
      <span className="theme-switch" aria-hidden="true" />
    </button>
  );
}

function SettingsChoices<Value extends string | number>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: Value;
  options: readonly (readonly [Value, string])[];
  onChange: (value: Value) => void;
}) {
  return (
    <div className="settings-choice-row">
      <span id={id}>{label}</span>
      <div className="settings-segments" role="group" aria-labelledby={id}>
        {options.map(([option, title]) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onChange(option)}
          >
            {title}
          </button>
        ))}
      </div>
    </div>
  );
}

type SliderLevels = typeof paceLevels | typeof biasLevels;

function PreferenceSlider({
  id,
  label,
  levels,
  value,
  onChange,
}: {
  id: string;
  label: string;
  levels: SliderLevels;
  value: Preferences["pace"];
  onChange: (value: Preferences["pace"]) => void;
}) {
  const { language } = useLanguage();
  const languageIndex = language === "en" ? 1 : 0;
  return (
    <div className="settings-slider">
      <div className="settings-slider-heading">
        <label htmlFor={id}>{label}</label>
        <span>{levels[value].label[languageIndex]}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={2}
        step={1}
        value={value}
        aria-valuetext={levels[value].label[languageIndex]}
        aria-describedby={id + "-hint"}
        onChange={(event) => {
          const next = preferenceLevels[event.currentTarget.valueAsNumber];
          if (next !== undefined) onChange(next);
        }}
      />
      <div className="settings-slider-labels" aria-hidden="true">
        {levels.map((level, index) => (
          <span key={level.label[0]} data-active={index === value}>
            {level.label[languageIndex]}
          </span>
        ))}
      </div>
      <p id={id + "-hint"}>{levels[value].hint[languageIndex]}</p>
    </div>
  );
}

function SettingsLink({
  label,
  icon,
  onOpen,
}: {
  label: string;
  icon: IconName;
  onOpen: (button: HTMLButtonElement) => void;
}) {
  return (
    <button
      className="settings-row settings-link"
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
    >
      <span className="settings-row-label">
        <AppIcon name={icon} />
        {label}
      </span>
      <span className="settings-row-trailing">
        <AppIcon name="right" />
      </span>
    </button>
  );
}

type SettingsPage = "behavior" | "integrations" | "privacy";
const version = "v0.1.0";
const brand = "Tokenow·NowDo";

const integrations = ["Google Calendar", "Outlook", "Notion", "Gmail"] as const;

export function SettingsDrawer({
  open,
  darkMode,
  preferences,
  setPreference,
  onToggleTheme,
  onClose,
  onReplay,
}: SettingsDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLButtonElement>(null);
  const previousScroll = useRef(0);
  const [page, setPage] = useState<SettingsPage | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const text = (key: keyof typeof copy) => copy[key][language === "en" ? 1 : 0];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.scrollTop = 0;
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog?.open) return;
    if (page) {
      dialog.scrollTop = 0;
      backButton.current?.focus({ preventScroll: true });
    } else if (returnFocus.current) {
      dialog.scrollTop = previousScroll.current;
      returnFocus.current.focus({ preventScroll: true });
      returnFocus.current = null;
    }
  }, [page]);

  const openPage = (next: SettingsPage, button: HTMLButtonElement) => {
    previousScroll.current = ref.current?.scrollTop ?? 0;
    returnFocus.current = button;
    setPage(next);
  };

  function handleClose() {
    returnFocus.current = null;
    setPage(null);
    onClose();
  }

  const title = page ? text(page) : t("settings");

  return (
    <dialog
      ref={ref}
      id="settings-drawer"
      className="settings-drawer"
      aria-labelledby="settings-title"
      onClose={handleClose}
      onCancel={(event) => {
        if (page) {
          event.preventDefault();
          setPage(null);
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div className="settings-body">
        <header className="settings-header">
          <div>
            {page ? (
              <button
                ref={backButton}
                className="icon-button settings-back"
                type="button"
                aria-label={text("back")}
                onClick={() => setPage(null)}
              >
                <AppIcon name="left" />
              </button>
            ) : (
              <img src={nowDoLogo} width={27} height={27} alt="" />
            )}
            <h2 id="settings-title">{title}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label={t("closeSettings")}
            onClick={handleClose}
          >
            <AppIcon name="close" />
          </button>
        </header>

        <div className="settings-root" hidden={page !== null}>
          <div className="settings-options">
            <SettingsSection id="settings-general" title={text("general")} icon="settings">
              <SettingsToggle label={t("darkMode")} checked={darkMode} onToggle={onToggleTheme} />
              <div className="settings-choice-row">
                <span id="language-title">{t("language")}</span>
                <div className="settings-segments" role="group" aria-labelledby="language-title">
                  <button
                    type="button"
                    lang="zh-CN"
                    aria-pressed={language === "zh"}
                    onClick={() => setLanguage("zh")}
                  >
                    中文
                  </button>
                  <button
                    type="button"
                    lang="en"
                    aria-pressed={language === "en"}
                    onClick={() => setLanguage("en")}
                  >
                    English
                  </button>
                </div>
              </div>
              <div className="settings-reminder">
                <label className="settings-choice-row">
                  <span>{text("reminders")}</span>
                  <select
                    value={preferences.reminders}
                    onChange={(event) => {
                      const value = reminderOptions.find(
                        (item) => item === event.currentTarget.value,
                      );
                      if (value) setPreference("reminders", value);
                    }}
                  >
                    {reminderOptions.map((option) => (
                      <option key={option} value={option}>
                        {text(option)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button className="settings-row settings-action" type="button" onClick={onReplay}>
                <span>{t("replay")}</span>
                <AppIcon name="play" />
              </button>
            </SettingsSection>

            <SettingsSection id="settings-smart" title={text("smart")} icon="sparkles">
              <SettingsToggle
                label={text("smartToggle")}
                checked={preferences.smartRecommendations}
                onToggle={() =>
                  setPreference("smartRecommendations", !preferences.smartRecommendations)
                }
              />
              <SettingsChoices
                id="settings-available"
                label={text("available")}
                value={preferences.defaultTime}
                options={defaultTimeOptions.map((minutes) => [
                  minutes,
                  minutes === 120 ? text("twoHours") : `${minutes} ${t("minute")}`,
                ])}
                onChange={(value) => setPreference("defaultTime", value)}
              />
              <SettingsChoices
                id="settings-count"
                label={text("recommendationCount")}
                value={preferences.recommendationCount}
                options={recommendationCounts.map((count) => [count, String(count)])}
                onChange={(value) => setPreference("recommendationCount", value)}
              />
              <SettingsToggle
                label={text("recovery")}
                checked={preferences.recoveryFeedback}
                onToggle={() => setPreference("recoveryFeedback", !preferences.recoveryFeedback)}
              />
              <SettingsLink
                label={text("behavior")}
                icon="sparkles"
                onOpen={(button) => openPage("behavior", button)}
              />
            </SettingsSection>

            <SettingsSection id="settings-calendar" title={text("calendar")} icon="calendar">
              <SettingsChoices
                id="settings-week-start"
                label={text("weekStart")}
                value={preferences.weekStart}
                options={weekStartOptions.map((day) => [day, text(day)])}
                onChange={(day) => setPreference("weekStart", day)}
              />
              <SettingsChoices
                id="settings-clock"
                label={text("clock")}
                value={preferences.clock}
                options={clockOptions.map((hours) => [
                  hours,
                  text(hours === 24 ? "hours24" : "hours12"),
                ])}
                onChange={(hours) => setPreference("clock", hours)}
              />
              <SettingsLink
                label={text("integrations")}
                icon="integrations"
                onOpen={(button) => openPage("integrations", button)}
              />
              <SettingsLink
                label={text("privacy")}
                icon="shield"
                onOpen={(button) => openPage("privacy", button)}
              />
            </SettingsSection>

            <SettingsSection id="settings-about" title={text("about")} icon="info">
              <div className="settings-row">
                <span className="settings-row-label">
                  <AppIcon name="info" />
                  {text("version")}
                </span>
                <span className="settings-row-trailing">{version}</span>
              </div>
              <div className="settings-row">
                <span className="settings-row-label">
                  <AppIcon name="code" />
                  {text("developer")}
                </span>
                <span className="settings-row-trailing">Rui Wang</span>
              </div>
            </SettingsSection>
          </div>
          <footer className="settings-brand">
            <strong>{brand}</strong>
            <p lang="en">From to-do to done.</p>
          </footer>
        </div>

        {page && (
          <section key={page} className="settings-subpage" aria-labelledby="settings-title">
            {page === "behavior" && (
              <div className="settings-card">
                <PreferenceSlider
                  id="settings-pace"
                  label={text("pace")}
                  levels={paceLevels}
                  value={preferences.pace}
                  onChange={(value) => setPreference("pace", value)}
                />
                <PreferenceSlider
                  id="settings-bias"
                  label={text("bias")}
                  levels={biasLevels}
                  value={preferences.bias}
                  onChange={(value) => setPreference("bias", value)}
                />
              </div>
            )}
            {page === "integrations" && (
              <div className="settings-card settings-integrations">
                <ul>
                  {integrations.map((name) => (
                    <li className="settings-row" key={name}>
                      <span>{name}</span>
                      <span className="settings-status" lang="en">
                        Coming Soon
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {page === "privacy" && (
              <div className="settings-card settings-privacy">
                <p>{text("privacyNote")}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </dialog>
  );
}
