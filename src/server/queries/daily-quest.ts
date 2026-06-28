import { db } from "@/lib/db";
import { canonicalDailyQuestDate, dailyQuestWeekRange, isDailyQuestScheduledForDate } from "@/lib/daily-quest";
import { resolveCurrentProfileId } from "@/server/services/profiles";

export async function listDailyQuests(profileId?: string | null) {
  const currentProfileId = await resolveCurrentProfileId(profileId);
  if (!currentProfileId) return [];
  const today = new Date();
  const week = dailyQuestWeekRange(today);
  const quests = await db.dailyQuest.findMany({
    where: { profileId: currentProfileId },
    include: {
      completions: {
        where: { profileId: currentProfileId, questDate: canonicalDailyQuestDate(today) },
        select: { id: true, contributionAmount: true },
      },
      _count: { select: { completions: true } },
    },
    orderBy: [{ isActive: "desc" }, { title: "asc" }, { createdAt: "asc" }],
  });
  const weeklyTotals = await db.dailyQuestCompletion.groupBy({
    by: ["dailyQuestId"],
    where: {
      profileId: currentProfileId,
      dailyQuestId: { in: quests.map((quest) => quest.id) },
      questDate: { gte: week.start, lte: week.end },
      contributionAmount: { not: null },
    },
    _sum: { contributionAmount: true },
  });
  const weeklyTotalByQuest = new Map(weeklyTotals.map((item) => [item.dailyQuestId, item._sum.contributionAmount ?? 0]));
  return quests.map(({ completions, _count, ...quest }) => {
    const todayCompletion = completions[0] ?? null;
    return {
      ...quest,
      isScheduledToday: isDailyQuestScheduledForDate(quest.daysOfWeek, today),
      isCompletedToday: Boolean(todayCompletion),
      todayContributionAmount: todayCompletion?.contributionAmount ?? null,
      weeklyProgressAmount: weeklyTotalByQuest.get(quest.id) ?? 0,
      completionCount: _count.completions,
    };
  });
}
