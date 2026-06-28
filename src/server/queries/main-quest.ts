import { db } from "@/lib/db";
import { resolveCurrentProfileId } from "@/server/services/profiles";

export async function listMainQuestOverview(profileId?: string | null) {
  const currentProfileId = await resolveCurrentProfileId(profileId);
  if (!currentProfileId) return { activeCampaigns: [], draftQuests: [], completedQuests: [] };
  const quests = await db.mainQuest.findMany({
    where: { profileId: currentProfileId, deletedAt: null },
    include: {
      category: true,
      rootAdventureLog: {
        include: {
          children: {
            where: { profileId: currentProfileId, deletedAt: null },
            orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
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
