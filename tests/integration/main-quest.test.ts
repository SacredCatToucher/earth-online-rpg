import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../../src/lib/db";
import { listAdventureLogs } from "../../src/server/queries/adventure-log";
import { createManualJournalEntry } from "../../src/server/services/adventure-log";
import { completeMainQuest, createMainQuest, updateMainQuestProgress } from "../../src/server/services/main-quest";

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
