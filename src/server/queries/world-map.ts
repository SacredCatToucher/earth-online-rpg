import { db } from "@/lib/db";

export type WorldMapConnection = {
  sourceId: string;
  targetId: string;
  kind: "EVENT_TREE" | "CHRONOLOGICAL";
};

export async function listWorldMap() {
  const locations = await db.mapLocation.findMany({
    where: { deletedAt: null },
    include: {
      logs: {
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          parent: { select: { id: true, title: true, locationId: true } },
        },
        orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
    orderBy: [{ eventDate: "asc" }, { createdAt: "asc" }],
  });
  const visibleLocationIds = new Set(locations.map((location) => location.id));
  const connections: WorldMapConnection[] = [];

  for (const [index, location] of locations.entries()) {
    const parentLocationId = location.logs[0]?.parent?.locationId;
    if (parentLocationId && parentLocationId !== location.id && visibleLocationIds.has(parentLocationId)) {
      connections.push({ sourceId: parentLocationId, targetId: location.id, kind: "EVENT_TREE" });
    } else if (index > 0) {
      connections.push({ sourceId: locations[index - 1].id, targetId: location.id, kind: "CHRONOLOGICAL" });
    }
  }

  return { locations, connections };
}
