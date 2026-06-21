import { db } from "@/lib/db";
import { canonicalDailyQuestDate, isDailyQuestScheduledForDate } from "@/lib/daily-quest";

export async function listDailyQuests() {
  const today = new Date();
  const quests = await db.dailyQuest.findMany({
    include: { completions: { where: { questDate: canonicalDailyQuestDate(today) }, select: { id: true } } },
    orderBy: [{ isActive: "desc" }, { title: "asc" }, { createdAt: "asc" }],
  });
  return quests.map(({ completions, ...quest }) => ({
    ...quest,
    isScheduledToday: isDailyQuestScheduledForDate(quest.daysOfWeek, today),
    isCompletedToday: completions.length > 0,
  }));
}
