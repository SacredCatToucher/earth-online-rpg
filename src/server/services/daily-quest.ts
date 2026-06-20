import { z } from "zod";
import { DAILY_QUEST_WEEKDAYS, normalizeDailyQuestWeekdays } from "@/lib/daily-quest";
import { db } from "@/lib/db";

const weekdayInput = z.array(z.enum(DAILY_QUEST_WEEKDAYS)).min(1);

export const dailyQuestInput = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(20_000).default(""),
  weekdays: weekdayInput,
  isActive: z.boolean().default(true),
});

export type DailyQuestInput = z.input<typeof dailyQuestInput>;

export async function createDailyQuest(input: DailyQuestInput) {
  const parsed = dailyQuestInput.parse(input);
  return db.dailyQuest.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      daysOfWeek: normalizeDailyQuestWeekdays(parsed.weekdays),
      isActive: parsed.isActive,
      expReward: 0,
    },
  });
}

export async function updateDailyQuest(id: string, input: DailyQuestInput) {
  const parsed = dailyQuestInput.parse(input);
  const quest = await db.dailyQuest.findUnique({ where: { id }, select: { id: true } });
  if (!quest) throw new Error("Daily Quest not found.");

  return db.dailyQuest.update({
    where: { id: quest.id },
    data: {
      title: parsed.title,
      description: parsed.description,
      daysOfWeek: normalizeDailyQuestWeekdays(parsed.weekdays),
      isActive: parsed.isActive,
    },
  });
}
