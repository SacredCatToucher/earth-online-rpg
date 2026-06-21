import { db } from "@/lib/db";

export async function listMainQuestOverview() {
  const quests = await db.mainQuest.findMany({
    where: { deletedAt: null },
    include: {
      category: true,
      rootAdventureLog: {
        include: {
          children: {
            where: { deletedAt: null },
            orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
            take: 3,
          },
        },
      },
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { createdAt: "desc" }],
  });

  return {
    activeCampaigns: quests.filter((quest) => quest.status === "ACTIVE"),
    draftQuests: quests.filter((quest) => quest.status === "DRAFT"),
    completedQuests: quests
      .filter((quest) => quest.status === "COMPLETED")
      .sort((a, b) => (b.completedDate?.getTime() ?? 0) - (a.completedDate?.getTime() ?? 0)),
  };
}
