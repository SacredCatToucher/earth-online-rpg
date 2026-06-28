import "dotenv/config";
import { randomUUID } from "node:crypto";
import AdmZip from "adm-zip";
import { afterAll, describe, expect, it } from "vitest";
import { BACKUP_FORMAT, DEFAULT_QUEST_CATEGORIES, DEFAULT_SKILLS } from "../../src/lib/constants";
import { db } from "../../src/lib/db";
import { createBackupArchive, restoreBackupArchive } from "../../src/server/services/backup";

const marker = `Phase 1 foundation test ${randomUUID()}`;

async function profileId() {
  const existing = await db.profile.findFirst({ orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  return existing?.id ?? (await db.profile.create({ data: { name: `${marker} profile`, isDefault: true } })).id;
}

describe("Phase 1 foundation", () => {
  afterAll(async () => {
    await db.mainQuest.deleteMany({ where: { title: { startsWith: marker } } });
    await db.mainQuestCategory.deleteMany({ where: { title: { startsWith: marker } } });
    await db.$disconnect();
  });

  it("provides editable onboarding examples", async () => {
    const [skills, categories] = await Promise.all([
      db.skill.findMany({ where: { title: { in: [...DEFAULT_SKILLS] } } }),
      db.mainQuestCategory.findMany({ where: { title: { in: [...DEFAULT_QUEST_CATEGORIES] } } }),
    ]);
    expect(skills).toHaveLength(DEFAULT_SKILLS.length);
    expect(categories).toHaveLength(DEFAULT_QUEST_CATEGORIES.length);
  });

  it("allows only one active Main Quest per category", async () => {
    const category = await db.mainQuestCategory.create({ data: { title: `${marker} category` } });
    const currentProfileId = await profileId();
    await db.mainQuest.create({
      data: { profileId: currentProfileId, categoryId: category.id, title: `${marker} active one`, progressType: "PERCENTAGE", status: "ACTIVE" },
    });
    await expect(
      db.mainQuest.create({
        data: { profileId: currentProfileId, categoryId: category.id, title: `${marker} active two`, progressType: "PERCENTAGE", status: "ACTIVE" },
      }),
    ).rejects.toThrow();
  });

  it("exports and restores a versioned SQLite backup", async () => {
    const archive = await createBackupArchive();
    const chunks: Buffer[] = [];
    for await (const chunk of archive) chunks.push(Buffer.from(chunk));
    const zip = new AdmZip(Buffer.concat(chunks));
    const manifest = JSON.parse(zip.readAsText("manifest.json")) as { format: string; version: number };
    expect(manifest.format).toBe(BACKUP_FORMAT);
    expect(manifest.version).toBe(1);
    expect(zip.getEntry("app.db")?.getData().subarray(0, 16).toString()).toBe("SQLite format 3\0");
    await restoreBackupArchive(Buffer.concat(chunks));
    expect(await db.mainQuestCategory.count()).toBeGreaterThanOrEqual(DEFAULT_QUEST_CATEGORIES.length);
  });
});
