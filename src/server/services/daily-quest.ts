import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  canonicalDailyQuestDate,
  DAILY_QUEST_WEEKDAYS,
  isDailyQuestScheduledForDate,
  normalizeDailyQuestWeekdays,
} from "@/lib/daily-quest";
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

export async function completeDailyQuestToday(id: string) {
  const today = new Date();
  const questDate = canonicalDailyQuestDate(today);
  const quest = await db.dailyQuest.findUnique({ where: { id } });
  if (!quest) throw new Error("Daily Quest not found.");
  if (!quest.isActive) throw new Error("Paused Daily Quests cannot be completed.");
  if (!isDailyQuestScheduledForDate(quest.daysOfWeek, today)) {
    throw new Error("Daily Quest is not scheduled for today.");
  }

  try {
    return await db.dailyQuestCompletion.create({
      data: { dailyQuestId: quest.id, questDate, expAwarded: 0 },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Daily Quest is already completed today.");
    }
    throw error;
  }
}

export async function undoDailyQuestCompletionToday(id: string) {
  const quest = await db.dailyQuest.findUnique({ where: { id }, select: { id: true } });
  if (!quest) throw new Error("Daily Quest not found.");

  const completion = await db.dailyQuestCompletion.findUnique({
    where: { dailyQuestId_questDate: { dailyQuestId: quest.id, questDate: canonicalDailyQuestDate() } },
    select: { id: true },
  });
  if (!completion) throw new Error("Daily Quest has no completion to undo today.");

  return db.dailyQuestCompletion.delete({ where: { id: completion.id } });
}
