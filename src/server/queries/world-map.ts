import { db } from "@/lib/db";

export type WorldMapConnection = {
  sourceId: string;
  targetId: string;
  kind: "EVENT_TREE" | "CHRONOLOGICAL";
};

export const WIDER_JOURNEY_WORLD_ID = "wider-journey";

type ConnectionLocation = {
  id: string;
  logs: Array<{ parent: { locationId: string | null } | null }>;
};

function buildConnections(locations: readonly ConnectionLocation[]) {
  const locationIds = new Set(locations.map((location) => location.id));
  const connections: WorldMapConnection[] = [];
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

export async function listWorldMap() {
  const [locations, categories] = await Promise.all([
    db.mapLocation.findMany({
      where: { deletedAt: null },
      include: {
        logs: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
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
      where: { quests: { some: { deletedAt: null } } },
      include: {
        quests: {
          where: { deletedAt: null },
          select: { id: true, title: true, description: true, status: true, createdAt: true },
          orderBy: [{ createdAt: "desc" }],
        },
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    }),
  ]);

  const connections = buildConnections(locations);

  const categoryWorlds = categories.map((category) => {
    const worldLocations = locations.filter((location) => {
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
      connections: buildConnections(worldLocations),
    };
  }).filter((world) => world.locations.length > 0 || world.activeDirection);

  const categorizedLocationIds = new Set(categoryWorlds.flatMap((world) => world.locations.map((location) => location.id)));
  const widerJourneyLocations = locations.filter((location) => !categorizedLocationIds.has(location.id));
  const worlds = [...categoryWorlds];
  if (widerJourneyLocations.length) {
    worlds.push({
      id: WIDER_JOURNEY_WORLD_ID,
      title: "Wider Journey",
      description: "Meaningful places that belong to the wider story of your life.",
      activeDirection: null,
      latestDiscovery: widerJourneyLocations[widerJourneyLocations.length - 1],
      locations: widerJourneyLocations,
      connections: buildConnections(widerJourneyLocations),
    });
  }

  return { locations, connections, worlds };
}
