import { db } from "@/lib/db";
import { canonicalDailyQuestDate, dailyQuestWeekRange, isDailyQuestScheduledForDate } from "@/lib/daily-quest";

export async function listDailyQuests() {
  const today = new Date();
  const week = dailyQuestWeekRange(today);
  const quests = await db.dailyQuest.findMany({
    include: {
      completions: {
        where: { questDate: canonicalDailyQuestDate(today) },
        select: { id: true, contributionAmount: true },
      },
      _count: { select: { completions: true } },
    },
    orderBy: [{ isActive: "desc" }, { title: "asc" }, { createdAt: "asc" }],
  });
  const weeklyTotals = await db.dailyQuestCompletion.groupBy({
    by: ["dailyQuestId"],
    where: {
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
