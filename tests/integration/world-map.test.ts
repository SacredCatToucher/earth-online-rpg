import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../../src/lib/db";
import { listWorldMap } from "../../src/server/queries/world-map";
import { createManualJournalEntry } from "../../src/server/services/adventure-log";

const marker = "Phase 4 World Map test";

describe("World Map event tree connections", () => {
  afterAll(async () => {
    const logs = await db.adventureLog.findMany({ where: { title: { startsWith: marker } }, select: { locationId: true } });
    const locationIds = logs.flatMap((log) => log.locationId ? [log.locationId] : []);
    await db.adventureLog.deleteMany({ where: { title: { startsWith: marker } } });
    await db.mapLocation.deleteMany({ where: { id: { in: locationIds } } });
    await db.$disconnect();
  });

  it("prefers mapped event parents and otherwise keeps chronological connections", async () => {
    const parent = await createManualJournalEntry(
      { title: `${marker} parent`, startDate: "2024-01-01", isMilestone: true },
      [],
    );
    const child = await createManualJournalEntry(
      { title: `${marker} child`, startDate: "2024-02-01", parentId: parent.id, isMilestone: true },
      [],
    );
    const standalone = await createManualJournalEntry(
      { title: `${marker} standalone`, startDate: "2024-03-01", isMilestone: true },
      [],
    );

    const map = await listWorldMap();
    const childLocation = map.locations.find((location) => location.id === child.locationId);
    const standaloneIndex = map.locations.findIndex((location) => location.id === standalone.locationId);
    const chronologicalPredecessor = map.locations[standaloneIndex - 1];

    expect(map.connections).toContainEqual({ sourceId: parent.locationId, targetId: child.locationId, kind: "EVENT_TREE" });
    expect(standaloneIndex).toBeGreaterThan(0);
    expect(map.connections).toContainEqual({ sourceId: chronologicalPredecessor.id, targetId: standalone.locationId, kind: "CHRONOLOGICAL" });
    expect(childLocation?.logs[0]?.parent).toEqual({ id: parent.id, title: parent.title, locationId: parent.locationId });
  });
});
