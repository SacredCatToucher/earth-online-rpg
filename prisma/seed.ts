import { PrismaClient } from "@prisma/client";
import { DEFAULT_QUEST_CATEGORIES, DEFAULT_SKILLS } from "../src/lib/constants";

const prisma = new PrismaClient();

export async function bootstrapDefaults() {
  await prisma.$transaction([
    ...DEFAULT_SKILLS.map((title) =>
      prisma.skill.upsert({ where: { title }, update: {}, create: { title } }),
    ),
    ...DEFAULT_QUEST_CATEGORIES.map((title, sortOrder) =>
      prisma.mainQuestCategory.upsert({
        where: { title },
        update: {},
        create: { title, sortOrder },
      }),
    ),
    prisma.appSetting.upsert({
      where: { key: "timezone" },
      update: {},
      create: { key: "timezone", value: process.env.RPG_TIMEZONE ?? "Asia/Taipei" },
    }),
    prisma.appSetting.upsert({
      where: { key: "bootstrapVersion" },
      update: { value: "1" },
      create: { key: "bootstrapVersion", value: "1" },
    }),
  ]);
}

bootstrapDefaults()
  .then(() => console.log("First-launch defaults are ready."))
  .finally(() => prisma.$disconnect());
