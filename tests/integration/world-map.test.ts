import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../../src/lib/db";
import { listWorldMap, WIDER_JOURNEY_WORLD_ID } from "../../src/server/queries/world-map";
import { createManualJournalEntry } from "../../src/server/services/adventure-log";
import { createMainQuest } from "../../src/server/services/main-quest";

const marker = "Phase 4 World Map test";

describe("World Map event tree connections", () => {
  afterAll(async () => {
    const logs = await db.adventureLog.findMany({ where: { title: { startsWith: marker } }, select: { locationId: true } });
    const locationIds = logs.flatMap((log) => log.locationId ? [log.locationId] : []);
    await db.mainQuest.deleteMany({ where: { title: { startsWith: marker } } });
    await db.adventureLog.deleteMany({ where: { title: { startsWith: marker } } });
    await db.mapLocation.deleteMany({ where: { id: { in: locationIds } } });
    await db.mainQuestCategory.deleteMany({ where: { title: { startsWith: marker } } });
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
    expect(childLocation?.logs[0]?.parent).toMatchObject({ id: parent.id, title: parent.title, locationId: parent.locationId });
    expect(map.worlds.find((world) => world.id === WIDER_JOURNEY_WORLD_ID)?.connections).toContainEqual({
      sourceId: parent.locationId,
      targetId: child.locationId,
      kind: "EVENT_TREE",
    });
  });

  it("groups verified quest milestones into Life Worlds and keeps unmatched milestones in Wider Journey without mutations", async () => {
    const category = await db.mainQuestCategory.create({ data: { title: `${marker} Education World` } });
    const directionOnlyCategory = await db.mainQuestCategory.create({ data: { title: `${marker} Direction World` } });
    const interleavingCategory = await db.mainQuestCategory.create({ data: { title: `${marker} Health World` } });
    const draftOnlyCategory = await db.mainQuestCategory.create({ data: { title: `${marker} Draft World` } });
    const emptyCategory = await db.mainQuestCategory.create({ data: { title: `${marker} Empty World` } });
    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} mapped direction`,
      description: "A meaningful direction through education.",
      progressType: "COUNT",
      status: "ACTIVE",
      startDate: "2026-01-01",
      placeRootOnWorldMap: true,
    });
    const interleavingQuest = await createMainQuest({
      categoryId: interleavingCategory.id,
      title: `${marker} interleaving direction`,
      progressType: "COUNT",
      status: "ACTIVE",
      startDate: "2026-01-02",
      placeRootOnWorldMap: true,
    });
    const laterCategoryQuest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} later mapped road`,
      progressType: "COUNT",
      status: "DRAFT",
      startDate: "2026-01-03",
      placeRootOnWorldMap: true,
    });
    const mappedChild = await createManualJournalEntry(
      { title: `${marker} inherited child milestone`, startDate: "2026-01-04", parentId: quest.rootAdventureLogId!, isMilestone: true },
      [],
    );
    await createMainQuest({
      categoryId: directionOnlyCategory.id,
      title: `${marker} direction without milestone`,
      progressType: "COUNT",
      status: "ACTIVE",
      startDate: "2026-01-01",
    });
    await createMainQuest({
      categoryId: draftOnlyCategory.id,
      title: `${marker} draft without milestone`,
      progressType: "COUNT",
    });
    const standalone = await createManualJournalEntry(
      { title: `${marker} wider memory`, startDate: "2026-02-01", isMilestone: true },
      [],
    );
    const countsBefore = {
      quests: await db.mainQuest.count(),
      logs: await db.adventureLog.count(),
      locations: await db.mapLocation.count(),
    };

    const map = await listWorldMap();
    const categoryWorld = map.worlds.find((world) => world.id === category.id);
    const directionOnlyWorld = map.worlds.find((world) => world.id === directionOnlyCategory.id);
    const widerJourney = map.worlds.find((world) => world.id === WIDER_JOURNEY_WORLD_ID);

    expect(categoryWorld?.activeDirection).toEqual({ id: quest.id, title: quest.title });
    expect(categoryWorld?.locations.some((location) => location.id === quest.rootAdventureLog?.locationId)).toBe(true);
    expect(categoryWorld?.locations.some((location) => location.id === mappedChild.locationId)).toBe(true);
    expect(map.locations.find((location) => location.id === mappedChild.locationId)?.logs[0]?.mainQuest?.category.id).toBe(category.id);
    expect(categoryWorld?.connections).toContainEqual({
      sourceId: quest.rootAdventureLog?.locationId,
      targetId: laterCategoryQuest.rootAdventureLog?.locationId,
      kind: "CHRONOLOGICAL",
    });
    expect(categoryWorld?.connections).toContainEqual({
      sourceId: quest.rootAdventureLog?.locationId,
      targetId: mappedChild.locationId,
      kind: "EVENT_TREE",
    });
    expect(categoryWorld?.connections.some((connection) => connection.sourceId === interleavingQuest.rootAdventureLog?.locationId)).toBe(false);
    expect(directionOnlyWorld?.locations).toEqual([]);
    expect(map.worlds.some((world) => world.id === draftOnlyCategory.id)).toBe(false);
    expect(map.worlds.some((world) => world.id === emptyCategory.id)).toBe(false);
    expect(widerJourney?.locations.some((location) => location.id === standalone.locationId)).toBe(true);
    expect(await db.mainQuest.count()).toBe(countsBefore.quests);
    expect(await db.adventureLog.count()).toBe(countsBefore.logs);
    expect(await db.mapLocation.count()).toBe(countsBefore.locations);
  });
});
