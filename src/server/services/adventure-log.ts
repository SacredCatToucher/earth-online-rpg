import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ADVENTURE_EVENT_TYPES } from "@/lib/constants";
import { db } from "@/lib/db";
import { eventDateFromInput } from "@/lib/dates";
import { deleteStoredAttachments, MAX_ATTACHMENTS_PER_ENTRY, storeAttachments } from "@/server/storage/attachments";

const journalInputBase = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(20_000).default(""),
  startDate: z.iso.date().optional(),
  eventDate: z.iso.date().optional(),
  endDate: z.union([z.iso.date(), z.literal("")]).optional().transform((value) => value || null),
  status: z.enum(["ONGOING", "COMPLETED"]).default("ONGOING"),
  parentId: z.union([z.string().min(1), z.literal("")]).optional().transform((value) => value || null),
  isMilestone: z.boolean().default(false),
});

export const journalInput = journalInputBase
  .superRefine((value, context) => {
    const startDate = value.startDate ?? value.eventDate;
    if (!startDate) context.addIssue({ code: "custom", path: ["startDate"], message: "Start date is required." });
    if (startDate && value.endDate && value.endDate < startDate) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "End date cannot be before the start date." });
    }
  })
  .transform((value) => ({ ...value, startDate: value.startDate ?? value.eventDate! }));

export type JournalInput = z.input<typeof journalInput>;

export function positionForLocation(index: number) {
  const column = index % 5;
  const row = Math.floor(index / 5) % 4;
  const cycle = Math.floor(index / 20);
  return {
    positionX: Math.min(91, 10 + column * 20 + (cycle % 3) * 2),
    positionY: Math.min(86, 14 + row * 23 + (cycle % 2) * 4),
  };
}

export async function journalMilestoneCreateData(
  tx: Prisma.TransactionClient,
  entry: { title: string; description: string; eventDate: Date },
) {
  const position = positionForLocation(await tx.mapLocation.count({ where: { deletedAt: null } }));
  return { ...entry, locationType: "JOURNAL_MILESTONE", ...position };
}

async function validateParent(tx: Prisma.TransactionClient, entryId: string, parentId: string | null) {
  if (!parentId) return null;
  if (parentId === entryId) throw new Error("An entry cannot be its own parent.");

  let currentId: string | null = parentId;
  let selectedParent: { id: string; parentId: string | null; mainQuestId: string | null } | null = null;
  const visited = new Set<string>();
  while (currentId) {
    if (visited.has(currentId)) throw new Error("The selected parent chain is already circular.");
    visited.add(currentId);
    const current: { id: string; parentId: string | null; mainQuestId: string | null; deletedAt: Date | null } | null = await tx.adventureLog.findUnique({
      where: { id: currentId },
      select: { id: true, parentId: true, mainQuestId: true, deletedAt: true },
    });
    if (!current || current.deletedAt) throw new Error("The selected parent entry does not exist.");
    if (!selectedParent) selectedParent = current;
    if (current.parentId === entryId) throw new Error("This parent would create a circular event chain.");
    currentId = current.parentId;
  }
  return selectedParent;
}

export async function createManualJournalEntry(input: JournalInput, files: File[]) {
  const parsed = journalInput.parse(input);
  const id = randomUUID();
  const stored = await storeAttachments(files);
  try {
    return await db.$transaction(async (tx) => {
      const parent = await validateParent(tx, id, parsed.parentId);
      const startDate = eventDateFromInput(parsed.startDate);
      const endDate = parsed.endDate ? eventDateFromInput(parsed.endDate) : null;
      const location = parsed.isMilestone
        ? await journalMilestoneCreateData(tx, { title: parsed.title, description: parsed.description, eventDate: startDate })
        : null;
      return tx.adventureLog.create({
        data: {
          id,
          eventType: "MANUAL_JOURNAL_ENTRY",
          origin: "MANUAL",
          title: parsed.title,
          description: parsed.description,
          eventDate: startDate,
          startDate,
          endDate,
          status: parsed.status,
          parent: parsed.parentId ? { connect: { id: parsed.parentId } } : undefined,
          mainQuest: parent?.mainQuestId ? { connect: { id: parent.mainQuestId } } : undefined,
          attachments: { create: stored },
          location: location ? { create: location } : undefined,
        },
        include: { attachments: true, location: true },
      });
    });
  } catch (error) {
    await deleteStoredAttachments(stored.map((item) => item.storageName));
    throw error;
  }
}

export async function updateManualJournalEntry(id: string, input: JournalInput, files: File[]) {
  const existing = await db.adventureLog.findFirst({
    where: { id, deletedAt: null },
    include: { location: true, rootForQuest: { select: { id: true } }, _count: { select: { attachments: true } } },
  });
  if (!existing) throw new Error("Journal entry not found.");
  if (existing.origin !== "MANUAL") throw new Error("System events cannot be rewritten as journal entries.");
  if (existing._count.attachments + files.length > MAX_ATTACHMENTS_PER_ENTRY) {
    throw new Error(`A journal entry can contain no more than ${MAX_ATTACHMENTS_PER_ENTRY} attachments.`);
  }

  const parsed = journalInput.parse(input);
  const stored = await storeAttachments(files);
  try {
    return await db.$transaction(async (tx) => {
      const parent = await validateParent(tx, id, parsed.parentId);
      const startDate = eventDateFromInput(parsed.startDate);
      const endDate = parsed.endDate ? eventDateFromInput(parsed.endDate) : null;
      const mainQuestId = parent ? parent.mainQuestId : existing.rootForQuest?.id ?? null;
      let locationId = existing.locationId;
      if (parsed.isMilestone && existing.location) {
        await tx.mapLocation.update({
          where: { id: existing.location.id },
          data: { title: parsed.title, description: parsed.description, eventDate: startDate, deletedAt: null },
        });
      } else if (parsed.isMilestone) {
        const location = await tx.mapLocation.create({
          data: await journalMilestoneCreateData(tx, { title: parsed.title, description: parsed.description, eventDate: startDate }),
        });
        locationId = location.id;
      } else {
        locationId = null;
      }

      const entry = await tx.adventureLog.update({
        where: { id },
        data: {
          title: parsed.title,
          description: parsed.description,
          eventDate: startDate,
          startDate,
          endDate,
          status: parsed.status,
          parentId: parsed.parentId,
          mainQuestId,
          locationId,
          attachments: { create: stored },
        },
        include: { attachments: true, location: true },
      });
      if (!parsed.isMilestone && existing.location?.locationType === "JOURNAL_MILESTONE") {
        await tx.mapLocation.update({ where: { id: existing.location.id }, data: { deletedAt: new Date() } });
      }
      return entry;
    });
  } catch (error) {
    await deleteStoredAttachments(stored.map((item) => item.storageName));
    throw error;
  }
}

export async function completeManualJournalEntry(id: string, completedDate: string) {
  const parsedCompletedDate = z.iso.date().parse(completedDate);
  const endDate = eventDateFromInput(parsedCompletedDate);
  const entry = await db.adventureLog.findFirst({ where: { id, deletedAt: null } });
  if (!entry) throw new Error("Journal entry not found.");
  if (entry.origin !== "MANUAL") throw new Error("System events cannot be completed manually.");
  if (entry.status !== "ONGOING") throw new Error("Only ongoing entries can be completed.");
  if (endDate < entry.startDate) throw new Error("Completion date cannot be before the start date.");
  return db.adventureLog.update({ where: { id }, data: { status: "COMPLETED", endDate } });
}

export async function softDeleteAdventureEntry(id: string) {
  const entry = await db.adventureLog.findFirst({ where: { id, deletedAt: null }, include: { location: true } });
  if (!entry) throw new Error("Journal entry not found.");
  return db.$transaction(async (tx) => {
    const deletedAt = new Date();
    const deleted = await tx.adventureLog.update({ where: { id }, data: { deletedAt } });
    if (entry.location?.locationType === "JOURNAL_MILESTONE") {
      await tx.mapLocation.update({ where: { id: entry.location.id }, data: { deletedAt } });
    }
    return deleted;
  });
}

export type SystemAdventureEvent = {
  eventType: Exclude<(typeof ADVENTURE_EVENT_TYPES)[number], "MANUAL_JOURNAL_ENTRY">;
  title: string;
  description?: string;
  eventDate?: Date;
  expEarned?: number;
  sourceType: string;
  sourceId: string;
  mainQuestId?: string;
  locationId?: string;
  skillId?: string;
  achievementId?: string;
  rewardId?: string;
  parentId?: string;
};

// Future quest, achievement, reward, level, location, and skill services use this inside their transaction.
export async function createSystemAdventureEvent(tx: Prisma.TransactionClient, event: SystemAdventureEvent) {
  const eventDate = event.eventDate ?? new Date();
  return tx.adventureLog.create({
    data: {
      ...event,
      origin: "SYSTEM",
      description: event.description ?? "",
      eventDate,
      startDate: eventDate,
      endDate: eventDate,
      status: "COMPLETED",
      expEarned: event.expEarned ?? 0,
    },
  });
}
