import { DEFAULT_QUEST_CATEGORIES, DEFAULT_SKILLS } from "@/lib/constants";
import { dailyQuestWeekday, normalizeDailyQuestWeekdays } from "@/lib/daily-quest";
import { db } from "@/lib/db";
import { ensureFirstLaunchDefaults } from "@/server/services/bootstrap";
import { deleteStoredAttachments } from "@/server/storage/attachments";

async function deleteAttachmentFiles() {
  const attachments = await db.attachment.findMany({ select: { storageName: true } });
  await deleteStoredAttachments(attachments.map((attachment) => attachment.storageName));
}

export async function clearAllLocalData() {
  await deleteAttachmentFiles();

  await db.$transaction(async (tx) => {
    await tx.attachment.deleteMany();
    await tx.mapEdge.deleteMany();
    await tx.expTransaction.deleteMany();
    await tx.dailyQuestCompletion.deleteMany();
    await tx.reward.deleteMany();
    await tx.adventureLog.deleteMany();
    await tx.mapLocation.deleteMany();
    await tx.mainQuest.deleteMany();
    await tx.dailyQuest.deleteMany();
    await tx.skillRecord.deleteMany();
    await tx.achievement.deleteMany();
    await tx.todo.deleteMany();
    await tx.character.deleteMany();
    await tx.skill.deleteMany({ where: { title: { notIn: [...DEFAULT_SKILLS] } } });
    await tx.mainQuestCategory.deleteMany({ where: { title: { notIn: [...DEFAULT_QUEST_CATEGORIES] } } });
  });

  await ensureFirstLaunchDefaults();
}

export async function resetDemoData() {
  await clearAllLocalData();

  const now = new Date();
  const phaseOneDate = new Date(now);
  phaseOneDate.setDate(now.getDate() - 10);
  const phaseTwoDate = new Date(now);
  phaseTwoDate.setDate(now.getDate() - 2);

  await db.$transaction(async (tx) => {
    await tx.character.create({ data: { name: "Demo Adventurer" } });
    const category = await tx.mainQuestCategory.findUniqueOrThrow({ where: { title: "Career" } });
    const rootLocation = await tx.mapLocation.create({
      data: {
        title: "Demo Career Road",
        description: "The first visible milestone for the demo journey.",
        eventDate: phaseOneDate,
        locationType: "JOURNAL_MILESTONE",
        positionX: 10,
        positionY: 14,
      },
    });
    const phaseLocation = await tx.mapLocation.create({
      data: {
        title: "Completed demo phase",
        description: "A completed phase placed on the World Map for route testing.",
        eventDate: phaseTwoDate,
        locationType: "JOURNAL_MILESTONE",
        positionX: 30,
        positionY: 14,
      },
    });
    const activePhaseLocation = await tx.mapLocation.create({
      data: {
        title: "Ongoing demo phase",
        description: "An active phase placed on the World Map for progress testing.",
        eventDate: now,
        locationType: "JOURNAL_MILESTONE",
        positionX: 50,
        positionY: 14,
      },
    });
    const quest = await tx.mainQuest.create({
      data: {
        categoryId: category.id,
        title: "Demo Career Road",
        description: "A demo Main Quest for testing the full RPG Life loop.",
        progressType: "PERCENTAGE",
        targetValue: 100,
        currentValue: 45,
        unit: "%",
        status: "ACTIVE",
        startDate: phaseOneDate,
      },
    });
    const root = await tx.adventureLog.create({
      data: {
        eventType: "MANUAL_JOURNAL_ENTRY",
        title: "Demo Career Road",
        description: "Main Quest root for the demo journey.",
        eventDate: phaseOneDate,
        startDate: phaseOneDate,
        status: "ONGOING",
        origin: "SYSTEM",
        sourceType: "MAIN_QUEST",
        sourceId: quest.id,
        mainQuestId: quest.id,
        locationId: rootLocation.id,
      },
    });
    await tx.mainQuest.update({ where: { id: quest.id }, data: { rootAdventureLogId: root.id } });
    await tx.mapLocation.update({ where: { id: rootLocation.id }, data: { mainQuestId: quest.id } });
    await tx.mapLocation.update({ where: { id: phaseLocation.id }, data: { mainQuestId: quest.id } });
    await tx.mapLocation.update({ where: { id: activePhaseLocation.id }, data: { mainQuestId: quest.id } });
    await tx.adventureLog.create({
      data: {
        eventType: "MANUAL_JOURNAL_ENTRY",
        title: "Completed demo phase",
        description: "A finished phase that branches from the Main Quest root.",
        eventDate: phaseTwoDate,
        startDate: phaseTwoDate,
        endDate: phaseTwoDate,
        status: "COMPLETED",
        origin: "MANUAL",
        mainQuestId: quest.id,
        parentId: root.id,
        locationId: phaseLocation.id,
      },
    });
    await tx.adventureLog.create({
      data: {
        eventType: "MANUAL_JOURNAL_ENTRY",
        title: "Ongoing demo phase",
        description: "An active phase for testing parent-child event tree behavior.",
        eventDate: now,
        startDate: now,
        status: "ONGOING",
        origin: "MANUAL",
        mainQuestId: quest.id,
        parentId: root.id,
        locationId: activePhaseLocation.id,
      },
    });
    await tx.dailyQuest.create({
      data: {
        title: "Demo daily practice",
        description: "A recurring step connected to the demo journey.",
        daysOfWeek: normalizeDailyQuestWeekdays([dailyQuestWeekday()]),
        isActive: true,
        expReward: 0,
      },
    });
    await tx.dailyQuest.create({
      data: {
        title: "Run today",
        description: "A progress Daily Quest for testing weekly contribution.",
        daysOfWeek: normalizeDailyQuestWeekdays([dailyQuestWeekday()]),
        isActive: true,
        expReward: 0,
        contributionEnabled: true,
        weeklyTargetAmount: 20,
        contributionUnit: "km",
        defaultContributionAmount: 3,
      },
    });
  });
}
