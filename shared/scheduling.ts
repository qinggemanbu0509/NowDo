export const clockTimePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function readStartTime(value: unknown): string | null {
  return typeof value === "string" && clockTimePattern.test(value) ? value : null;
}

export function readDueDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value ? value : null;
}

export function dateInTimeZone(now: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    calendar: "iso8601",
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function resolveDate(text: string, today: string): string | null {
  const source = text.normalize("NFKC");
  const absolute = readDueDate(source.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0]);
  if (absolute) return absolute;

  const monthDay = source.match(/(?:(\d{4})年\s*)?(\d{1,2})月\s*(\d{1,2})(?:日|号)/);
  if (monthDay) {
    const [, year, month, day] = monthDay;
    return readDueDate(
      `${year ?? today.slice(0, 4)}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    );
  }

  const date = new Date(`${today}T00:00:00Z`);
  const offset = source.match(/大后天|后天|明天|今天|今日/)?.[0];
  if (offset) {
    const days: Record<string, number> = { 今天: 0, 今日: 0, 明天: 1, 后天: 2, 大后天: 3 };
    date.setUTCDate(date.getUTCDate() + days[offset]);
    return date.toISOString().slice(0, 10);
  }

  const englishRelative = source
    .match(/\b(the day after tomorrow|tomorrow|today)\b/i)?.[0]
    .toLowerCase();
  if (englishRelative) {
    const days = englishRelative === "today" ? 0 : englishRelative === "tomorrow" ? 1 : 2;
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  const relative =
    source.match(/(\d{1,3})\s*[天日]后/) ?? source.match(/\bin\s+(\d{1,3})\s+days?\b/i);
  if (relative) {
    date.setUTCDate(date.getUTCDate() + Number(relative[1]));
    return date.toISOString().slice(0, 10);
  }

  const weekday = source.match(/(下下|下|本|这)?(?:周|星期|礼拜)([一二三四五六日天])/);
  const englishDays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const englishWeekday = source.match(
    /\b(?:(this|next)\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  );
  if (!weekday && !englishWeekday) return null;
  const week =
    weekday?.[1] ??
    (englishWeekday?.[1]?.toLowerCase() === "next" ? "下" : englishWeekday?.[1] ? "本" : undefined);
  const day = weekday?.[2];
  const todayIndex = (date.getUTCDay() + 6) % 7;
  const targetIndex = day
    ? day === "天"
      ? 6
      : "一二三四五六日".indexOf(day)
    : englishDays.indexOf(englishWeekday![2].toLowerCase());
  const difference = targetIndex - todayIndex;
  const weeks = week === "下下" ? 2 : week === "下" || (!week && difference < 0) ? 1 : 0;
  date.setUTCDate(date.getUTCDate() + difference + weeks * 7);
  return date.toISOString().slice(0, 10);
}

export function resolveNumericTime(text: string): string | null {
  const englishTime = text.match(/\b(1[0-2]|[1-9])(?::([0-5]\d))?\s*([ap])\.?m\b/i);
  if (englishTime) {
    const hour = (Number(englishTime[1]) % 12) + (englishTime[3].toLowerCase() === "p" ? 12 : 0);
    return String(hour).padStart(2, "0") + ":" + (englishTime[2] ?? "00");
  }
  const match = text
    .normalize("NFKC")
    .match(
      /(?:^|[^\d])(?:(凌晨|清晨|早上|上午|中午|下午|傍晚|晚上)\s*)?(\d{1,2})\s*(?::(\d{2})|点(?:\s*(半|\d{1,2}\s*分))?)/,
    );
  if (!match) return null;
  const [, period, hourText, colonMinutes, spokenMinutes] = match;
  let hour = Number(hourText);
  const minutes =
    spokenMinutes === "半" ? 30 : Number(colonMinutes ?? spokenMinutes?.replace(/\s*分$/, "") ?? 0);
  if (period === "下午" || period === "傍晚" || period === "晚上" || period === "中午") {
    if (hour < 12) hour += 12;
  } else if (period && hour === 12) {
    hour = 0;
  }
  return readStartTime(`${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
}

export function minuteOfDay(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function clockLabel(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
