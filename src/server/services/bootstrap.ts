import { Prisma } from "@prisma/client";
import { DEFAULT_QUEST_CATEGORIES, DEFAULT_SKILLS } from "@/lib/constants";
import { db } from "@/lib/db";
import { defaultProfileName } from "@/lib/profiles";
import { ensureDefaultProfileCharacter } from "@/server/services/character";

async function hasUserCreatedData(tx: Prisma.TransactionClient) {
  const [characters, mainQuests, dailyQuests, adventureLogs, mapLocations] = await Promise.all([
    tx.character.count(),
    tx.mainQuest.count(),
    tx.dailyQuest.count(),
    tx.adventureLog.count(),
    tx.mapLocation.count(),
  ]);
  return characters + mainQuests + dailyQuests + adventureLogs + mapLocations > 0;
}

export async function ensureFirstLaunchDefaults() {
  await db.$transaction(async (tx) => {
    if ((await tx.profile.count()) === 0 && (await hasUserCreatedData(tx))) {
      await tx.profile.create({ data: { name: defaultProfileName, isDefault: true } });
    }
    for (const title of DEFAULT_SKILLS) {
      await tx.skill.upsert({ where: { title }, update: {}, create: { title } });
    }
    for (const [sortOrder, title] of DEFAULT_QUEST_CATEGORIES.entries()) {
      await tx.mainQuestCategory.upsert({
        where: { title },
        update: {},
        create: { title, sortOrder },
      });
    }
    await tx.appSetting.upsert({
      where: { key: "bootstrapVersion" },
      update: { value: "1" },
      create: { key: "bootstrapVersion", value: "1" },
    });
    await tx.appSetting.upsert({
      where: { key: "timezone" },
      update: {},
      create: { key: "timezone", value: process.env.RPG_TIMEZONE ?? "Asia/Taipei" },
    });
    await ensureDefaultProfileCharacter(tx);
  });
}
