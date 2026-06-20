import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { eventDateFromInput, localDateInputValue } from "@/lib/dates";
import { createSystemAdventureEvent, journalMilestoneCreateData } from "@/server/services/adventure-log";

export const createMainQuestInput = z
  .object({
    categoryId: z.string().min(1),
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(20_000).default(""),
    progressType: z.string().trim().min(1).max(40),
    targetValue: z.number().int().positive().default(100),
    currentValue: z.number().int().nonnegative().default(0),
    unit: z.string().trim().min(1).max(20).default("%"),
    status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
    startDate: z.iso.date().optional(),
    rootAdventureLogId: z.string().min(1).optional(),
    placeRootOnWorldMap: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.currentValue > value.targetValue) {
      context.addIssue({ code: "custom", path: ["currentValue"], message: "Current progress cannot exceed the target." });
    }
  });

export type CreateMainQuestInput = z.input<typeof createMainQuestInput>;

export const activateMainQuestInput = z.object({
  startDate: z.iso.date(),
});

export type ActivateMainQuestInput = z.input<typeof activateMainQuestInput>;

export const updateMainQuestProgressInput = z.object({
  currentValue: z.number().int().nonnegative(),
});

export type UpdateMainQuestProgressInput = z.input<typeof updateMainQuestProgressInput>;

async function collectDescendantIds(tx: Prisma.TransactionClient, rootId: string) {
  const ids = [rootId];
  let parentIds = [rootId];
  while (parentIds.length) {
    const children = await tx.adventureLog.findMany({
      where: { parentId: { in: parentIds }, deletedAt: null },
      select: { id: true, mainQuestId: true },
    });
    if (children.some((child) => child.mainQuestId)) {
      throw new Error("The selected Adventure Log tree already belongs to another Main Quest.");
    }
    parentIds = children.map((child) => child.id);
    ids.push(...parentIds);
  }
  return ids;
}

export async function createMainQuest(input: CreateMainQuestInput) {
  const parsed = createMainQuestInput.parse(input);
  const questId = randomUUID();

  try {
    return await db.$transaction(async (tx) => {
      const category = await tx.mainQuestCategory.findUnique({ where: { id: parsed.categoryId }, select: { id: true } });
      if (!category) throw new Error("Main Quest category not found.");

      if (parsed.status === "ACTIVE") {
        const activeQuest = await tx.mainQuest.findFirst({
          where: { categoryId: parsed.categoryId, status: "ACTIVE", deletedAt: null },
          select: { id: true },
        });
        if (activeQuest) throw new Error("This category already has an active Main Quest.");
      }

      const startDate = parsed.startDate ? eventDateFromInput(parsed.startDate) : new Date();
      await tx.mainQuest.create({
        data: {
          id: questId,
          categoryId: parsed.categoryId,
          title: parsed.title,
          description: parsed.description,
          progressType: parsed.progressType,
          targetValue: parsed.targetValue,
          currentValue: parsed.currentValue,
          unit: parsed.unit,
          status: parsed.status,
          startDate: parsed.status === "ACTIVE" ? startDate : null,
        },
      });

      let rootAdventureLogId = parsed.rootAdventureLogId;
      if (rootAdventureLogId) {
        const root = await tx.adventureLog.findUnique({
          where: { id: rootAdventureLogId },
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            locationId: true,
            parentId: true,
            deletedAt: true,
            mainQuestId: true,
            rootForQuest: { select: { id: true } },
          },
        });
        if (!root || root.deletedAt) throw new Error("Root Adventure Log entry not found.");
        if (root.parentId) throw new Error("A Main Quest root must be a root Adventure Log entry.");
        if (root.mainQuestId || root.rootForQuest) throw new Error("This Adventure Log root already belongs to a Main Quest.");

        const treeIds = await collectDescendantIds(tx, root.id);
        await tx.adventureLog.updateMany({ where: { id: { in: treeIds } }, data: { mainQuestId: questId } });
        if (parsed.placeRootOnWorldMap && !root.locationId) {
          const location = await tx.mapLocation.create({
            data: await journalMilestoneCreateData(tx, {
              title: root.title,
              description: root.description,
              eventDate: root.startDate,
            }),
          });
          await tx.adventureLog.update({ where: { id: root.id }, data: { locationId: location.id } });
        }
      } else {
        const location = parsed.placeRootOnWorldMap
          ? await tx.mapLocation.create({
              data: await journalMilestoneCreateData(tx, {
                title: parsed.title,
                description: parsed.description,
                eventDate: startDate,
              }),
            })
          : null;
        const root = await tx.adventureLog.create({
          data: {
            eventType: "MANUAL_JOURNAL_ENTRY",
            title: parsed.title,
            description: parsed.description,
            eventDate: startDate,
            startDate,
            status: "ONGOING",
            origin: "SYSTEM",
            sourceType: "MAIN_QUEST",
            sourceId: questId,
            mainQuestId: questId,
            locationId: location?.id,
          },
        });
        rootAdventureLogId = root.id;
      }

      return tx.mainQuest.update({
        where: { id: questId },
        data: { rootAdventureLogId },
        include: { category: true, rootAdventureLog: true },
      });
    });
  } catch (error) {
    if (parsed.status === "ACTIVE" && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("This category already has an active Main Quest.");
    }
    throw error;
  }
}

export async function completeMainQuest(id: string, completedDate?: string) {
  const completionDate = eventDateFromInput(z.iso.date().parse(completedDate ?? localDateInputValue()));

  return db.$transaction(async (tx) => {
    const quest = await tx.mainQuest.findFirst({
      where: { id, deletedAt: null },
      include: { rootAdventureLog: true },
    });
    if (!quest) throw new Error("Main Quest not found.");
    if (quest.status !== "ACTIVE") throw new Error("Only active Main Quests can be completed.");
    if (quest.startDate && completionDate < quest.startDate) {
      throw new Error("Completion date cannot be before the Main Quest start date.");
    }
    if (quest.rootAdventureLog && completionDate < quest.rootAdventureLog.startDate) {
      throw new Error("Completion date cannot be before the root Adventure Log start date.");
    }

    if (quest.rootAdventureLog?.status === "ONGOING") {
      await tx.adventureLog.update({
        where: { id: quest.rootAdventureLog.id },
        data: { status: "COMPLETED", endDate: completionDate },
      });
    }

    const completedQuest = await tx.mainQuest.update({
      where: { id: quest.id },
      data: { status: "COMPLETED", completedDate: completionDate },
      include: { category: true, rootAdventureLog: true },
    });
    const event = await createSystemAdventureEvent(tx, {
      eventType: "QUEST_COMPLETED",
      title: `${quest.title} completed`,
      description: "Main Quest completed.",
      eventDate: completionDate,
      sourceType: "MAIN_QUEST",
      sourceId: quest.id,
      mainQuestId: quest.id,
      parentId: quest.rootAdventureLogId ?? undefined,
    });

    return { quest: completedQuest, event };
  });
}

export async function activateMainQuest(id: string, input: ActivateMainQuestInput) {
  const parsed = activateMainQuestInput.parse(input);
  const startDate = eventDateFromInput(parsed.startDate);

  try {
    return await db.$transaction(async (tx) => {
      const quest = await tx.mainQuest.findFirst({
        where: { id, deletedAt: null },
        include: { rootAdventureLog: true },
      });
      if (!quest) throw new Error("Main Quest not found.");
      if (quest.status !== "DRAFT") throw new Error("Only draft Main Quests can be activated.");

      const activeQuest = await tx.mainQuest.findFirst({
        where: { categoryId: quest.categoryId, status: "ACTIVE", deletedAt: null },
        select: { id: true },
      });
      if (activeQuest) throw new Error("This category already has an active Main Quest.");

      if (quest.rootAdventureLog) {
        await tx.adventureLog.update({
          where: { id: quest.rootAdventureLog.id },
          data: { status: "ONGOING", startDate, eventDate: startDate, endDate: null },
        });
        if (quest.rootAdventureLog.locationId) {
          await tx.mapLocation.update({
            where: { id: quest.rootAdventureLog.locationId },
            data: { eventDate: startDate },
          });
        }
      }

      return tx.mainQuest.update({
        where: { id: quest.id },
        data: { status: "ACTIVE", startDate },
        include: { category: true, rootAdventureLog: true },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("This category already has an active Main Quest.");
    }
    throw error;
  }
}

export async function updateMainQuestProgress(id: string, input: UpdateMainQuestProgressInput) {
  const parsed = updateMainQuestProgressInput.parse(input);
  const quest = await db.mainQuest.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, targetValue: true },
  });
  if (!quest) throw new Error("Main Quest not found.");
  if (parsed.currentValue > quest.targetValue) throw new Error("Current progress cannot exceed the target.");

  return db.mainQuest.update({
    where: { id: quest.id },
    data: { currentValue: parsed.currentValue },
  });
}
