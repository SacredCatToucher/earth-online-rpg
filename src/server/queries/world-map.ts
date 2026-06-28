import { db } from "@/lib/db";
import { resolveCurrentProfileId } from "@/server/services/profiles";

export type WorldMapConnection = {
  sourceId: string;
  targetId: string;
  kind: "EVENT_TREE" | "CHRONOLOGICAL";
};

export const WIDER_JOURNEY_WORLD_ID = "wider-journey";

type ConnectionLocation = {
  id: string;
  isMainQuestRoot: boolean;
  logs: Array<{ parent: { locationId: string | null } | null }>;
};

function buildConnections(locations: readonly ConnectionLocation[], useBranchAwarePath = false) {
  const locationIds = new Set(locations.map((location) => location.id));
  const connections: WorldMapConnection[] = [];
  const mainRoadLocations = locations.filter((location) => location.isMainQuestRoot);

  if (useBranchAwarePath) {
    const backboneLocations = mainRoadLocations.length
      ? mainRoadLocations
      : locations.filter((location) => {
          const parentLocationId = location.logs[0]?.parent?.locationId;
          return !parentLocationId || parentLocationId === location.id || !locationIds.has(parentLocationId);
        });
    for (let index = 1; index < backboneLocations.length; index++) {
      connections.push({
        sourceId: backboneLocations[index - 1].id,
        targetId: backboneLocations[index].id,
        kind: "CHRONOLOGICAL",
      });
    }
    for (const location of locations) {
      const parentLocationId = location.logs[0]?.parent?.locationId;
      if (parentLocationId && parentLocationId !== location.id && locationIds.has(parentLocationId)) {
        connections.push({ sourceId: parentLocationId, targetId: location.id, kind: "EVENT_TREE" });
      }
    }
    return connections;
  }

  for (const [index, location] of locations.entries()) {
    const parentLocationId = location.logs[0]?.parent?.locationId;
    if (parentLocationId && parentLocationId !== location.id && locationIds.has(parentLocationId)) {
      connections.push({ sourceId: parentLocationId, targetId: location.id, kind: "EVENT_TREE" });
    } else if (index > 0) {
      connections.push({ sourceId: locations[index - 1].id, targetId: location.id, kind: "CHRONOLOGICAL" });
    }
  }
  return connections;
}

export async function listWorldMap(profileId?: string | null) {
  const currentProfileId = await resolveCurrentProfileId(profileId);
  if (!currentProfileId) return { locations: [], connections: [], worlds: [] };
  const [locations, categories] = await Promise.all([
    db.mapLocation.findMany({
      where: { profileId: currentProfileId, deletedAt: null },
      include: {
        logs: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            rootForQuest: { select: { id: true } },
            parent: {
              select: {
                id: true,
                title: true,
                locationId: true,
                mainQuest: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    deletedAt: true,
                    category: { select: { id: true, title: true, sortOrder: true } },
                  },
                },
              },
            },
            mainQuest: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                deletedAt: true,
                category: { select: { id: true, title: true, sortOrder: true } },
              },
            },
          },
          orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
      },
      orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
    }),
    db.mainQuestCategory.findMany({
      where: { quests: { some: { profileId: currentProfileId, deletedAt: null } } },
      include: {
        quests: {
          where: { profileId: currentProfileId, deletedAt: null },
          select: { id: true, title: true, description: true, status: true, createdAt: true },
          orderBy: [{ createdAt: "desc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
  ]);

  const mapLocations = locations.map((location) => ({
    ...location,
    isMainQuestRoot: Boolean(location.logs[0]?.rootForQuest),
  }));
  const connections = buildConnections(mapLocations);

  const categoryWorlds = categories.map((category) => {
    const worldLocations = mapLocations.filter((location) => {
      const log = location.logs[0];
      const quest = log?.mainQuest ?? log?.parent?.mainQuest;
      return quest && !quest.deletedAt && quest.category.id === category.id;
    });
    const activeDirection = category.quests.find((quest) => quest.status === "ACTIVE") ?? null;
    const contextQuest = activeDirection ?? category.quests[0] ?? null;
    return {
      id: category.id,
      title: category.title,
      description: contextQuest?.description || "This part of your life is still taking shape.",
      activeDirection: activeDirection ? { id: activeDirection.id, title: activeDirection.title } : null,
      latestDiscovery: worldLocations.length ? worldLocations[worldLocations.length - 1] : null,
      locations: worldLocations,
      connections: buildConnections(worldLocations, true),
    };
  }).filter((world) => world.locations.length > 0 || world.activeDirection);

  const categorizedLocationIds = new Set(categoryWorlds.flatMap((world) => world.locations.map((location) => location.id)));
  const widerJourneyLocations = mapLocations.filter((location) => !categorizedLocationIds.has(location.id));
  const worlds = [...categoryWorlds];
  if (widerJourneyLocations.length) {
    worlds.push({
      id: WIDER_JOURNEY_WORLD_ID,
      title: "Wider Journey",
      description: "Meaningful places that belong to the wider story of your life.",
      activeDirection: null,
      latestDiscovery: widerJourneyLocations[widerJourneyLocations.length - 1],
      locations: widerJourneyLocations,
      connections: buildConnections(widerJourneyLocations, true),
    });
  }

  return { locations: mapLocations, connections, worlds };
}
