import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../../src/lib/db";
import { listAdventureLogs } from "../../src/server/queries/adventure-log";
import { createManualJournalEntry } from "../../src/server/services/adventure-log";
import { activateMainQuest, completeMainQuest, createMainQuest, updateMainQuestProgress } from "../../src/server/services/main-quest";

const marker = "Phase 4 Main Quest test";

async function createCategory(suffix: string) {
  return db.mainQuestCategory.create({ data: { title: `${marker} ${suffix}` } });
}

describe("Main Quest backend foundation", () => {
  afterAll(async () => {
    const locations = await db.mapLocation.findMany({
      where: { title: { startsWith: marker } },
      select: { id: true },
    });
    await db.mainQuest.deleteMany({ where: { title: { startsWith: marker } } });
    await db.adventureLog.deleteMany({ where: { title: { startsWith: marker } } });
    await db.mapLocation.deleteMany({ where: { id: { in: locations.map((location) => location.id) } } });
    await db.mainQuestCategory.deleteMany({ where: { title: { startsWith: marker } } });
    await db.$disconnect();
  });

  it("creates a Main Quest and its root Adventure Log atomically", async () => {
    const category = await createCategory("new root category");
    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} new root`,
      description: "A quest with a generated chronicle root.",
      progressType: "PERCENTAGE",
      status: "ACTIVE",
      startDate: "2026-06-19",
    });

    expect(quest.rootAdventureLogId).toBeTruthy();
    expect(quest.rootAdventureLog?.mainQuestId).toBe(quest.id);
    expect(quest.rootAdventureLog?.parentId).toBeNull();
    expect(quest.rootAdventureLog?.status).toBe("ONGOING");
    expect(quest.rootAdventureLog?.startDate.toISOString()).toBe("2026-06-19T12:00:00.000Z");
    expect(quest.rootAdventureLog?.locationId).toBeNull();
  });

  it("optionally places the Main Quest root on the World Map", async () => {
    const category = await createCategory("mapped root category");
    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} mapped root`,
      description: "A quest root that should become a location.",
      progressType: "COUNT",
      startDate: "2026-02-03",
      placeRootOnWorldMap: true,
    });

    expect(quest.rootAdventureLog?.locationId).toBeTruthy();
    const location = await db.mapLocation.findUniqueOrThrow({ where: { id: quest.rootAdventureLog!.locationId! } });
    expect(location.title).toBe(quest.title);
    expect(location.description).toBe(quest.description);
    expect(location.eventDate.toISOString()).toBe("2026-02-03T12:00:00.000Z");
    expect(location.locationType).toBe("JOURNAL_MILESTONE");
    expect(await db.mapEdge.count({ where: { OR: [{ sourceId: location.id }, { targetId: location.id }] } })).toBe(0);
  });

  it("prevents two active Main Quests in one category", async () => {
    const category = await createCategory("active constraint category");
    await createMainQuest({ categoryId: category.id, title: `${marker} active one`, progressType: "COUNT", status: "ACTIVE" });

    await expect(
      createMainQuest({ categoryId: category.id, title: `${marker} active two`, progressType: "COUNT", status: "ACTIVE" }),
    ).rejects.toThrow("This category already has an active Main Quest.");
    expect(await db.mainQuest.count({ where: { categoryId: category.id, status: "ACTIVE", deletedAt: null } })).toBe(1);
    expect(await db.adventureLog.count({ where: { title: `${marker} active two` } })).toBe(0);
  });

  it("links an existing root and preserves its Adventure Log tree", async () => {
    const category = await createCategory("existing root category");
    const root = await createManualJournalEntry(
      { title: `${marker} existing root`, description: "Keep this root intact.", startDate: "2025-01-10" },
      [],
    );
    const child = await createManualJournalEntry(
      { title: `${marker} existing child`, description: "Already nested.", startDate: "2025-02-10", parentId: root.id },
      [],
    );

    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} linked quest`,
      progressType: "COUNT",
      rootAdventureLogId: root.id,
    });
    const [linkedRoot, linkedChild] = await Promise.all([
      db.adventureLog.findUniqueOrThrow({ where: { id: root.id } }),
      db.adventureLog.findUniqueOrThrow({ where: { id: child.id } }),
    ]);

    expect(quest.rootAdventureLogId).toBe(root.id);
    expect(linkedRoot.title).toBe(`${marker} existing root`);
    expect(linkedRoot.description).toBe("Keep this root intact.");
    expect(linkedRoot.mainQuestId).toBe(quest.id);
    expect(linkedChild.parentId).toBe(root.id);
    expect(linkedChild.mainQuestId).toBe(quest.id);
  });

  it("keeps new child events compatible with quest inheritance and tree queries", async () => {
    const category = await createCategory("event tree category");
    const quest = await createMainQuest({ categoryId: category.id, title: `${marker} event tree`, progressType: "COUNT" });
    const child = await createManualJournalEntry(
      { title: `${marker} child event`, description: "First branch.", startDate: "2026-01-02", parentId: quest.rootAdventureLogId! },
      [],
    );
    const grandchild = await createManualJournalEntry(
      { title: `${marker} grandchild event`, description: "Nested branch.", startDate: "2026-01-03", parentId: child.id },
      [],
    );
    const result = await listAdventureLogs({ search: marker });
    const root = result.entries.find((entry) => entry.id === quest.rootAdventureLogId);

    expect(child.mainQuestId).toBe(quest.id);
    expect(grandchild.mainQuestId).toBe(quest.id);
    expect(root?.children.some((entry) => entry.id === child.id)).toBe(true);
    expect(root?.children.find((entry) => entry.id === child.id)?.children.some((entry) => entry.id === grandchild.id)).toBe(true);
  });

  it("activates an unmapped draft and synchronizes its root without changing progress or creating events", async () => {
    const category = await createCategory("unmapped activation category");
    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} unmapped activation`,
      progressType: "COUNT",
      targetValue: 12,
      currentValue: 4,
      status: "DRAFT",
    });

    const activated = await activateMainQuest(quest.id, { startDate: "2026-03-04" });
    const root = await db.adventureLog.findUniqueOrThrow({ where: { id: quest.rootAdventureLogId! } });

    expect(activated.status).toBe("ACTIVE");
    expect(activated.startDate?.toISOString()).toBe("2026-03-04T12:00:00.000Z");
    expect(activated.currentValue).toBe(4);
    expect(activated.targetValue).toBe(12);
    expect(root.status).toBe("ONGOING");
    expect(root.startDate.toISOString()).toBe("2026-03-04T12:00:00.000Z");
    expect(root.eventDate.toISOString()).toBe("2026-03-04T12:00:00.000Z");
    expect(root.endDate).toBeNull();
    expect(root.locationId).toBeNull();
    expect(await db.mapLocation.count({ where: { logs: { some: { id: root.id } } } })).toBe(0);
    expect(await db.adventureLog.count({ where: { mainQuestId: quest.id, eventType: "QUEST_COMPLETED" } })).toBe(0);
  });

  it("activates and completes a mapped draft without replacing its location or mapping the completion event", async () => {
    const category = await createCategory("mapped activation category");
    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} mapped activation`,
      description: "Original quest description.",
      progressType: "PERCENTAGE",
      status: "DRAFT",
      placeRootOnWorldMap: true,
    });
    const locationId = quest.rootAdventureLog!.locationId!;
    const locationBefore = await db.mapLocation.update({
      where: { id: locationId },
      data: {
        title: `${marker} preserved map title`,
        description: "Preserve this map description.",
        locationType: "JOURNAL_MILESTONE",
        positionX: 73,
        positionY: 41,
      },
    });

    await activateMainQuest(quest.id, { startDate: "2026-03-05" });
    const rootAfterActivation = await db.adventureLog.findUniqueOrThrow({ where: { id: quest.rootAdventureLogId! } });
    const locationAfterActivation = await db.mapLocation.findUniqueOrThrow({ where: { id: locationId } });

    expect(rootAfterActivation.locationId).toBe(locationId);
    expect(locationAfterActivation.eventDate.toISOString()).toBe("2026-03-05T12:00:00.000Z");
    expect(locationAfterActivation.title).toBe(locationBefore.title);
    expect(locationAfterActivation.description).toBe(locationBefore.description);
    expect(locationAfterActivation.locationType).toBe(locationBefore.locationType);
    expect(locationAfterActivation.positionX).toBe(locationBefore.positionX);
    expect(locationAfterActivation.positionY).toBe(locationBefore.positionY);
    expect(await db.mapLocation.count({ where: { logs: { some: { id: rootAfterActivation.id } } } })).toBe(1);
    expect(await db.mapEdge.count({ where: { OR: [{ sourceId: locationId }, { targetId: locationId }] } })).toBe(0);

    const completed = await completeMainQuest(quest.id, "2026-04-01");
    const completedRoot = await db.adventureLog.findUniqueOrThrow({ where: { id: quest.rootAdventureLogId! } });
    expect(completedRoot.locationId).toBe(locationId);
    expect(await db.mapLocation.count({ where: { id: locationId } })).toBe(1);
    expect(completed.event.locationId).toBeNull();
  });

  it("rejects activation when the category already has an active Main Quest", async () => {
    const category = await createCategory("activation conflict category");
    await createMainQuest({ categoryId: category.id, title: `${marker} activation blocker`, progressType: "COUNT", status: "ACTIVE" });
    const draft = await createMainQuest({ categoryId: category.id, title: `${marker} blocked draft`, progressType: "COUNT", status: "DRAFT" });
    const originalRoot = await db.adventureLog.findUniqueOrThrow({ where: { id: draft.rootAdventureLogId! } });

    await expect(activateMainQuest(draft.id, { startDate: "2026-03-06" })).rejects.toThrow(
      "This category already has an active Main Quest.",
    );
    const unchanged = await db.mainQuest.findUniqueOrThrow({ where: { id: draft.id } });
    const unchangedRoot = await db.adventureLog.findUniqueOrThrow({ where: { id: draft.rootAdventureLogId! } });
    expect(unchanged.status).toBe("DRAFT");
    expect(unchanged.startDate).toBeNull();
    expect(unchangedRoot.startDate).toEqual(originalRoot.startDate);
  });

  it("rejects activation for active and completed Main Quests", async () => {
    await expect(activateMainQuest("missing-main-quest", { startDate: "2026-03-07" })).rejects.toThrow("Main Quest not found.");

    const activeCategory = await createCategory("already active activation category");
    const active = await createMainQuest({
      categoryId: activeCategory.id,
      title: `${marker} already active activation`,
      progressType: "COUNT",
      status: "ACTIVE",
      startDate: "2026-01-01",
    });
    await expect(activateMainQuest(active.id, { startDate: "2026-03-07" })).rejects.toThrow(
      "Only draft Main Quests can be activated.",
    );

    const completedCategory = await createCategory("completed activation category");
    const completed = await createMainQuest({
      categoryId: completedCategory.id,
      title: `${marker} completed activation`,
      progressType: "COUNT",
      status: "ACTIVE",
      startDate: "2026-01-01",
    });
    await completeMainQuest(completed.id, "2026-02-01");
    await expect(activateMainQuest(completed.id, { startDate: "2026-03-07" })).rejects.toThrow(
      "Only draft Main Quests can be activated.",
    );
  });

  it("completes the quest, root entry, and completion event atomically", async () => {
    const category = await createCategory("completion category");
    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} completion lifecycle`,
      progressType: "COUNT",
      status: "ACTIVE",
      startDate: "2026-01-01",
      placeRootOnWorldMap: true,
    });
    const result = await completeMainQuest(quest.id, "2026-06-20");
    const root = await db.adventureLog.findUniqueOrThrow({ where: { id: quest.rootAdventureLogId! } });

    expect(result.quest.status).toBe("COMPLETED");
    expect(result.quest.completedDate?.toISOString()).toBe("2026-06-20T12:00:00.000Z");
    expect(root.status).toBe("COMPLETED");
    expect(root.endDate?.toISOString()).toBe("2026-06-20T12:00:00.000Z");
    expect(result.event.eventType).toBe("QUEST_COMPLETED");
    expect(result.event.mainQuestId).toBe(quest.id);
    expect(result.event.parentId).toBe(root.id);
    expect(result.event.expEarned).toBe(0);
    expect(result.event.locationId).toBeNull();
    expect(root.locationId).toBeTruthy();
    expect(await db.mapLocation.count({ where: { id: root.locationId! } })).toBe(1);
  });

  it("rejects completion for a quest that is not active", async () => {
    const category = await createCategory("draft completion category");
    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} draft completion rejection`,
      progressType: "COUNT",
      status: "DRAFT",
    });

    await expect(completeMainQuest(quest.id, "2026-06-20")).rejects.toThrow("Only active Main Quests can be completed.");
    expect((await db.mainQuest.findUniqueOrThrow({ where: { id: quest.id } })).status).toBe("DRAFT");
    expect(await db.adventureLog.count({ where: { mainQuestId: quest.id, eventType: "QUEST_COMPLETED" } })).toBe(0);
  });

  it("updates only current progress without completing the quest or creating events", async () => {
    const category = await createCategory("progress category");
    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} progress update`,
      description: "Progress changes only.",
      progressType: "COUNT",
      targetValue: 10,
      currentValue: 2,
      unit: "steps",
      status: "ACTIVE",
    });
    const eventCount = await db.adventureLog.count({ where: { mainQuestId: quest.id } });
    const updated = await updateMainQuestProgress(quest.id, { currentValue: 10 });

    expect(updated.currentValue).toBe(10);
    expect(updated.targetValue).toBe(quest.targetValue);
    expect(updated.categoryId).toBe(quest.categoryId);
    expect(updated.title).toBe(quest.title);
    expect(updated.description).toBe(quest.description);
    expect(updated.rootAdventureLogId).toBe(quest.rootAdventureLogId);
    expect(updated.status).toBe("ACTIVE");
    expect(updated.completedDate).toBeNull();
    expect(await db.adventureLog.count({ where: { mainQuestId: quest.id } })).toBe(eventCount);
  });

  it("rejects progress outside the quest range", async () => {
    const category = await createCategory("progress validation category");
    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} progress validation`,
      progressType: "COUNT",
      targetValue: 5,
    });

    await expect(updateMainQuestProgress(quest.id, { currentValue: -1 })).rejects.toThrow();
    await expect(updateMainQuestProgress(quest.id, { currentValue: 6 })).rejects.toThrow("Current progress cannot exceed the target.");
    expect((await db.mainQuest.findUniqueOrThrow({ where: { id: quest.id } })).currentValue).toBe(0);
  });

  it("does not update soft-deleted Main Quests", async () => {
    const category = await createCategory("deleted progress category");
    const quest = await createMainQuest({
      categoryId: category.id,
      title: `${marker} deleted progress`,
      progressType: "COUNT",
      targetValue: 5,
    });
    await db.mainQuest.update({ where: { id: quest.id }, data: { deletedAt: new Date() } });

    await expect(updateMainQuestProgress(quest.id, { currentValue: 1 })).rejects.toThrow("Main Quest not found.");
    expect((await db.mainQuest.findUniqueOrThrow({ where: { id: quest.id } })).currentValue).toBe(0);
  });
});
