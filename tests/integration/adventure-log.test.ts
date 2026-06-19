import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../../src/lib/db";
import { createManualJournalEntry, createSystemAdventureEvent, softDeleteAdventureEntry, updateManualJournalEntry } from "../../src/server/services/adventure-log";
import { listAdventureLogs } from "../../src/server/queries/adventure-log";
import { deleteStoredAttachments, readStoredAttachment } from "../../src/server/storage/attachments";

const marker = "Phase 2 test";

describe("Adventure Log", () => {
  afterAll(async () => {
    const entries = await db.adventureLog.findMany({ where: { title: { startsWith: marker } }, include: { attachments: true } });
    await deleteStoredAttachments(entries.flatMap((entry) => entry.attachments.map((file) => file.storageName)));
    await db.adventureLog.deleteMany({ where: { title: { startsWith: marker } } });
    const locations = await db.mapLocation.findMany({ where: { title: { startsWith: marker } }, select: { id: true } });
    await db.mapEdge.deleteMany({ where: { OR: [{ sourceId: { in: locations.map((item) => item.id) } }, { targetId: { in: locations.map((item) => item.id) } }] } });
    await db.mapLocation.deleteMany({ where: { id: { in: locations.map((item) => item.id) } } });
    await db.$disconnect();
  });

  it("creates and synchronizes an optional World Map milestone", async () => {
    const created = await createManualJournalEntry(
      { title: `${marker} mountain summit`, description: "Reached the summit.", eventDate: "2025-10-03", isMilestone: true },
      [],
    );
    expect(created.location).not.toBeNull();
    expect(created.location?.locationType).toBe("JOURNAL_MILESTONE");
    expect(created.location?.eventDate.toISOString()).toBe("2025-10-03T12:00:00.000Z");

    const linkedLocation = await db.mapLocation.findUniqueOrThrow({
      where: { id: created.locationId! },
      include: { logs: { where: { deletedAt: null } } },
    });
    expect(linkedLocation.logs.map((entry) => entry.id)).toContain(created.id);

    const updated = await updateManualJournalEntry(
      created.id,
      { title: `${marker} mountain return`, description: "A changed memory.", eventDate: "2025-10-04", isMilestone: true },
      [],
    );
    expect(updated.locationId).toBe(created.locationId);
    expect(updated.location?.title).toContain("return");
    expect(updated.location?.eventDate.toISOString()).toBe("2025-10-04T12:00:00.000Z");

    const removed = await updateManualJournalEntry(
      created.id,
      { title: updated.title, description: updated.description, eventDate: "2025-10-04", isMilestone: false },
      [],
    );
    expect(removed.locationId).toBeNull();
    expect((await db.mapLocation.findUniqueOrThrow({ where: { id: created.locationId! } })).deletedAt).not.toBeNull();
  });

  it("retires a journal milestone when its source entry is removed", async () => {
    const created = await createManualJournalEntry(
      { title: `${marker} lasting place`, description: "Visible until the memory is removed.", eventDate: "2024-05-11", isMilestone: true },
      [],
    );
    await softDeleteAdventureEntry(created.id);
    expect((await db.mapLocation.findUniqueOrThrow({ where: { id: created.locationId! } })).deletedAt).not.toBeNull();
  });

  it("creates, searches, filters, and updates a manual memory with attachments", async () => {
    const image = new File([Buffer.from("test-image")], "milestone.png", { type: "image/png" });
    const created = await createManualJournalEntry(
      { title: `${marker} first dive`, description: "A detail worth finding again.", eventDate: "2026-06-19" },
      [image],
    );
    expect(created.eventType).toBe("MANUAL_JOURNAL_ENTRY");
    expect(created.origin).toBe("MANUAL");
    expect(created.eventDate.toISOString()).toBe("2026-06-19T12:00:00.000Z");
    expect(created.attachments).toHaveLength(1);
    expect((await readStoredAttachment(created.attachments[0].storageName)).toString()).toBe("test-image");

    const found = await listAdventureLogs({ search: "first dive", type: "MANUAL_JOURNAL_ENTRY", from: "2026-06-01", to: "2026-06-30" });
    expect(found.entries.some((entry) => entry.id === created.id)).toBe(true);

    const document = new File([Buffer.from("notes")], "notes.txt", { type: "text/plain" });
    const updated = await updateManualJournalEntry(
      created.id,
      { title: `${marker} first ocean dive`, description: "Revised memory.", eventDate: "2026-06-20" },
      [document],
    );
    expect(updated.title).toContain("ocean");
    expect(updated.eventDate.toISOString()).toBe("2026-06-20T12:00:00.000Z");
    expect(updated.attachments).toHaveLength(2);

    const later = await createManualJournalEntry(
      { title: `${marker} later chapter`, description: "A newer chapter.", eventDate: "2027-01-04" },
      [],
    );
    const ordered = await listAdventureLogs({ search: marker });
    expect(ordered.entries.findIndex((entry) => entry.id === later.id)).toBeLessThan(
      ordered.entries.findIndex((entry) => entry.id === updated.id),
    );

    await softDeleteAdventureEntry(created.id);
    const visible = await listAdventureLogs({ search: "first ocean dive" });
    expect(visible.entries).toHaveLength(0);
  });

  it("accepts typed events from future quest transactions", async () => {
    const event = await db.$transaction((tx) =>
      createSystemAdventureEvent(tx, {
        eventType: "QUEST_COMPLETED",
        title: `${marker} quest complete`,
        description: "Generated by the quest service.",
        expEarned: 500,
        sourceType: "MAIN_QUEST",
        sourceId: "phase-2-test-quest",
      }),
    );
    expect(event.origin).toBe("SYSTEM");
    expect(event.eventType).toBe("QUEST_COMPLETED");
    expect(event.expEarned).toBe(500);
    await expect(
      updateManualJournalEntry(
        event.id,
        { title: `${marker} rewritten system event`, description: "Not allowed.", eventDate: "2020-01-01" },
        [],
      ),
    ).rejects.toThrow("System events cannot be rewritten");
  });
});
