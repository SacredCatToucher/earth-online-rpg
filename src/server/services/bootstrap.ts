import { DEFAULT_QUEST_CATEGORIES, DEFAULT_SKILLS } from "@/lib/constants";
import { db } from "@/lib/db";

export async function ensureFirstLaunchDefaults() {
  await db.$transaction(async (tx) => {
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
  });
}
