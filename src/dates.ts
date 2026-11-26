import { dateInTimeZone } from "../shared/scheduling.ts";

export const demoTimeZone = "Europe/Berlin";

export const demoClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: demoTimeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function demoDateKey(date: Date): string {
  return dateInTimeZone(date, demoTimeZone);
}

export function dateFromKey(key: string): Date {
  return new Date(`${key}T12:00:00Z`);
}

export function addDays(date: Date, days: number): Date {
  const next = dateFromKey(demoDateKey(date));
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function mondayOf(date: Date): Date {
  return addDays(date, -((date.getUTCDay() + 6) % 7));
}
