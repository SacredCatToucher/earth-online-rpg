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
