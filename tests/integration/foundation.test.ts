import "dotenv/config";
import AdmZip from "adm-zip";
import { afterAll, describe, expect, it } from "vitest";
import { BACKUP_FORMAT, DEFAULT_QUEST_CATEGORIES, DEFAULT_SKILLS } from "../../src/lib/constants";
import { db } from "../../src/lib/db";
import { createBackupArchive, restoreBackupArchive } from "../../src/server/services/backup";

describe("Phase 1 foundation", () => {
  afterAll(async () => {
    await db.mainQuest.deleteMany({ where: { title: { startsWith: "Integration test" } } });
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
    const category = await db.mainQuestCategory.findUniqueOrThrow({ where: { title: "Career" } });
    await db.mainQuest.create({
      data: { categoryId: category.id, title: "Integration test one", progressType: "PERCENTAGE", status: "ACTIVE" },
    });
    await expect(
      db.mainQuest.create({
        data: { categoryId: category.id, title: "Integration test two", progressType: "PERCENTAGE", status: "ACTIVE" },
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
