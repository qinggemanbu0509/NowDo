import { useEffect, useState } from "react";
import type { Language } from "../shared/language.ts";

export const defaultTimeOptions = [10, 30, 120] as const;
export const recommendationCounts = [1, 3, 5] as const;
export const reminderOptions = ["off", "atStart", "beforeStart"] as const;
export const weekStartOptions = ["monday", "sunday"] as const;
export const clockOptions = [24, 12] as const;
export const preferenceLevels = [0, 1, 2] as const;
export type ClockFormat = (typeof clockOptions)[number];

export interface Preferences {
  reminders: (typeof reminderOptions)[number];
  smartRecommendations: boolean;
  defaultTime: (typeof defaultTimeOptions)[number];
  recommendationCount: (typeof recommendationCounts)[number];
  recoveryFeedback: boolean;
  pace: (typeof preferenceLevels)[number];
  bias: (typeof preferenceLevels)[number];
  weekStart: (typeof weekStartOptions)[number];
  clock: ClockFormat;
}

export type SetPreference = <Key extends keyof Preferences>(
  key: Key,
  value: Preferences[Key],
) => void;

const storageKey = "nowdo.preferences";
const defaults: Preferences = {
  reminders: "off",
  smartRecommendations: true,
  defaultTime: 30,
  recommendationCount: 3,
  recoveryFeedback: true,
  pace: 1,
  bias: 1,
  weekStart: "monday",
  clock: 24,
};

function choice<T>(value: unknown, choices: readonly T[], fallback: T): T {
  return choices.find((item) => item === value) ?? fallback;
}

function readPreferences(): Preferences {
  try {
    const saved: Partial<Preferences> = JSON.parse(localStorage.getItem(storageKey) ?? "{}") ?? {};
    return {
      reminders: choice(saved.reminders, reminderOptions, defaults.reminders),
      smartRecommendations:
        typeof saved.smartRecommendations === "boolean"
          ? saved.smartRecommendations
          : defaults.smartRecommendations,
      defaultTime: choice(saved.defaultTime, defaultTimeOptions, defaults.defaultTime),
      recommendationCount: choice(
        saved.recommendationCount,
        recommendationCounts,
        defaults.recommendationCount,
      ),
      recoveryFeedback:
        typeof saved.recoveryFeedback === "boolean"
          ? saved.recoveryFeedback
          : defaults.recoveryFeedback,
      pace: choice(saved.pace, preferenceLevels, defaults.pace),
      bias: choice(saved.bias, preferenceLevels, defaults.bias),
      weekStart: choice(saved.weekStart, weekStartOptions, defaults.weekStart),
      clock: choice(saved.clock, clockOptions, defaults.clock),
    };
  } catch {
    return defaults;
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      // Settings still apply to the current session if storage is unavailable.
    }
  }, [preferences]);

  const setPreference: SetPreference = (key, value) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };
  return { preferences, setPreference };
}

export function formatClock(time: string, format: ClockFormat, language: Language) {
  if (format === 24) return time;
  const [hours, minutes] = time.split(":");
  const hour = Number(hours) % 24;
  const clock = `${hour % 12 || 12}:${minutes}`;
  if (language === "zh") return `${hour < 12 ? "上午" : "下午"} ${clock}`;
  return `${clock} ${hour < 12 ? "AM" : "PM"}`;
}
