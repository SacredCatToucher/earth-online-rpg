import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  canonicalDailyQuestDate,
  DAILY_QUEST_WEEKDAYS,
  dailyQuestWeekRange,
  isDailyQuestScheduledForDate,
  normalizeDailyQuestWeekdays,
} from "@/lib/daily-quest";
import { db } from "@/lib/db";

const weekdayInput = z.array(z.enum(DAILY_QUEST_WEEKDAYS)).min(1);
const optionalPositiveNumber = z.preprocess(
  (value) => value === "" || value === null || value === undefined ? null : Number(value),
  z.number().positive().nullable(),
);

export const dailyQuestInput = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(20_000).default(""),
    weekdays: weekdayInput,
    isActive: z.boolean().default(true),
    contributionEnabled: z.boolean().default(false),
    weeklyTargetAmount: optionalPositiveNumber.default(null),
    contributionUnit: z.string().trim().max(20).optional().transform((value) => value ?? ""),
    defaultContributionAmount: optionalPositiveNumber.default(null),
  })
  .superRefine((value, context) => {
    if (!value.contributionEnabled) return;
    if (!value.weeklyTargetAmount) {
      context.addIssue({ code: "custom", path: ["weeklyTargetAmount"], message: "Weekly target must be greater than 0." });
    }
    if (!value.defaultContributionAmount) {
      context.addIssue({ code: "custom", path: ["defaultContributionAmount"], message: "Default daily contribution must be greater than 0." });
    }
    if (!value.contributionUnit.trim()) {
      context.addIssue({ code: "custom", path: ["contributionUnit"], message: "Unit is required." });
    }
  });

export type DailyQuestInput = z.input<typeof dailyQuestInput>;

export const completeDailyQuestInput = z.object({
  contributionAmount: optionalPositiveNumber.optional(),
});

export type CompleteDailyQuestInput = z.input<typeof completeDailyQuestInput>;

export async function createDailyQuest(input: DailyQuestInput) {
  const parsed = dailyQuestInput.parse(input);
  return db.dailyQuest.create({
    data: {
      title: parsed.title,
      description: parsed.description,
      daysOfWeek: normalizeDailyQuestWeekdays(parsed.weekdays),
      isActive: parsed.isActive,
      expReward: 0,
      contributionEnabled: parsed.contributionEnabled,
      weeklyTargetAmount: parsed.contributionEnabled ? parsed.weeklyTargetAmount : null,
      contributionUnit: parsed.contributionEnabled ? parsed.contributionUnit : null,
      defaultContributionAmount: parsed.contributionEnabled ? parsed.defaultContributionAmount : null,
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
      contributionEnabled: parsed.contributionEnabled,
      weeklyTargetAmount: parsed.contributionEnabled ? parsed.weeklyTargetAmount : null,
      contributionUnit: parsed.contributionEnabled ? parsed.contributionUnit : null,
      defaultContributionAmount: parsed.contributionEnabled ? parsed.defaultContributionAmount : null,
    },
  });
}

export async function weeklyContributionTotal(id: string, date = new Date()) {
  const week = dailyQuestWeekRange(date);
  const result = await db.dailyQuestCompletion.aggregate({
    where: {
      dailyQuestId: id,
      questDate: { gte: week.start, lte: week.end },
      contributionAmount: { not: null },
    },
    _sum: { contributionAmount: true },
  });
  return result._sum.contributionAmount ?? 0;
}

export async function completeDailyQuestToday(id: string, input: CompleteDailyQuestInput = {}) {
  const parsed = completeDailyQuestInput.parse(input);
  const today = new Date();
  const questDate = canonicalDailyQuestDate(today);
  const quest = await db.dailyQuest.findUnique({ where: { id } });
  if (!quest) throw new Error("Daily Quest not found.");
  if (!quest.isActive) throw new Error("Paused Daily Quests cannot be completed.");
  if (!isDailyQuestScheduledForDate(quest.daysOfWeek, today)) {
    throw new Error("Daily Quest is not scheduled for today.");
  }
  const contributionAmount = quest.contributionEnabled ? parsed.contributionAmount : null;
  if (quest.contributionEnabled && !contributionAmount) {
    throw new Error("Contribution amount must be greater than 0.");
  }

  try {
    const completion = await db.dailyQuestCompletion.create({
      data: { dailyQuestId: quest.id, questDate, expAwarded: 0, contributionAmount },
    });
    return {
      ...completion,
      weeklyProgressAmount: quest.contributionEnabled ? await weeklyContributionTotal(quest.id, today) : null,
    };
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
