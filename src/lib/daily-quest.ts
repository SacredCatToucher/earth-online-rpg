import { localDateInputValue } from "@/lib/dates";

export const DAILY_QUEST_WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export type DailyQuestWeekday = (typeof DAILY_QUEST_WEEKDAYS)[number];

const weekdayLabels: Record<DailyQuestWeekday, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

const weekdaysByIndex: DailyQuestWeekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function canonicalDailyQuestDate(date = new Date()) {
  return localDateInputValue(date);
}

export function dailyQuestWeekRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: canonicalDailyQuestDate(start),
    end: canonicalDailyQuestDate(end),
  };
}

export function dailyQuestWeekday(date = new Date()) {
  return weekdaysByIndex[date.getDay()];
}

export function isDailyQuestScheduledForDate(daysOfWeek: string, date = new Date()) {
  return parseDailyQuestWeekdays(daysOfWeek).includes(dailyQuestWeekday(date));
}

export function normalizeDailyQuestWeekdays(days: readonly DailyQuestWeekday[]) {
  const selected = new Set(days);
  return DAILY_QUEST_WEEKDAYS.filter((day) => selected.has(day)).join(",");
}

export function parseDailyQuestWeekdays(value: string): DailyQuestWeekday[] {
  const stored = new Set(value.split(","));
  return DAILY_QUEST_WEEKDAYS.filter((day) => stored.has(day));
}

export function formatDailyQuestCadence(value: string) {
  const days = parseDailyQuestWeekdays(value);
  if (days.length === DAILY_QUEST_WEEKDAYS.length) return "Every day";
  return days.map((day) => weekdayLabels[day]).join(", ");
}
