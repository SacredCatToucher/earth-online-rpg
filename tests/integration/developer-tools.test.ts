import "dotenv/config";
import { afterAll, describe, expect, it, vi } from "vitest";
import { DEFAULT_QUEST_CATEGORIES } from "../../src/lib/constants";
import { db } from "../../src/lib/db";
import { listWorldMap } from "../../src/server/queries/world-map";
import { clearAllLocalData, resetDemoData } from "../../src/server/services/developer-tools";
import { POST } from "../../src/app/api/developer-tools/route";

async function requestDeveloperTool(action: string) {
  return POST(new Request("http://localhost/api/developer-tools", {
    method: "POST",
    body: JSON.stringify({ action }),
  }));
}

describe("Developer Tools data reset", () => {
  afterAll(async () => {
    await clearAllLocalData();
    await db.$disconnect();
  });

  it("clears local test data while preserving required defaults", async () => {
    await clearAllLocalData();
    const category = await db.mainQuestCategory.create({ data: { title: "Developer tools test category" } });
    const quest = await db.mainQuest.create({
      data: {
        categoryId: category.id,
        title: "Developer tools test quest",
        progressType: "COUNT",
        status: "ACTIVE",
      },
    });
    await db.dailyQuest.create({ data: { title: "Developer tools test daily", daysOfWeek: "MON" } });
    const location = await db.mapLocation.create({ data: { title: "Developer tools test map", eventDate: new Date() } });
    await db.adventureLog.create({
      data: {
        eventType: "MANUAL_JOURNAL_ENTRY",
        title: "Developer tools test log",
        origin: "MANUAL",
        mainQuestId: quest.id,
        locationId: location.id,
      },
    });

    await clearAllLocalData();

    expect(await db.mainQuest.count()).toBe(0);
    expect(await db.dailyQuest.count()).toBe(0);
    expect(await db.adventureLog.count()).toBe(0);
    expect(await db.mapLocation.count()).toBe(0);
    expect(await db.mainQuestCategory.count({ where: { title: "Developer tools test category" } })).toBe(0);
    expect(await db.mainQuestCategory.count({ where: { title: { in: [...DEFAULT_QUEST_CATEGORIES] } } })).toBe(DEFAULT_QUEST_CATEGORIES.length);
  });

  it("resets a stable demo data set without stacking duplicates", async () => {
    await clearAllLocalData();
    await resetDemoData();
    const firstCounts = {
      quests: await db.mainQuest.count(),
      logs: await db.adventureLog.count(),
      dailyQuests: await db.dailyQuest.count(),
      locations: await db.mapLocation.count(),
    };
    await resetDemoData();
    const secondCounts = {
      quests: await db.mainQuest.count(),
      logs: await db.adventureLog.count(),
      dailyQuests: await db.dailyQuest.count(),
      locations: await db.mapLocation.count(),
    };
    const map = await listWorldMap();
    const demoWorld = map.worlds.find((world) => world.title === "Career");

    expect(secondCounts).toEqual(firstCounts);
    expect(secondCounts).toEqual({ quests: 1, logs: 3, dailyQuests: 1, locations: 2 });
    expect(await db.mainQuest.count({ where: { status: "ACTIVE" } })).toBe(1);
    expect(await db.adventureLog.count({ where: { status: "COMPLETED" } })).toBe(1);
    expect(await db.adventureLog.count({ where: { status: "ONGOING" } })).toBe(2);
    expect(demoWorld?.activeDirection?.title).toBe("Demo Career Road");
    expect(demoWorld?.locations).toHaveLength(2);
    expect(demoWorld?.connections.length).toBeGreaterThan(0);
  });

  it("blocks API mutations in production", async () => {
    await resetDemoData();
    const before = await db.mainQuest.count();
    vi.stubEnv("NODE_ENV", "production");
    try {
      const response = await requestDeveloperTool("clear");
      const body = await response.json() as { error?: string };

      expect(response.status).toBe(403);
      expect(body.error).toBe("Developer Tools are disabled in production environments.");
      expect(await db.mainQuest.count()).toBe(before);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("keeps API actions available outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    try {
      const response = await requestDeveloperTool("reset-demo");
      const body = await response.json() as { message?: string };

      expect(response.status).toBe(200);
      expect(body.message).toBe("Demo data has been reset.");
      expect(await db.mainQuest.count({ where: { title: "Demo Career Road" } })).toBe(1);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("returns valid JSON after clearing and leaves World Map empty-state safe", async () => {
    await resetDemoData();
    vi.stubEnv("NODE_ENV", "test");
    try {
      const response = await requestDeveloperTool("clear");
      const body = await response.json() as { message?: string };
      const map = await listWorldMap();

      expect(response.status).toBe(200);
      expect(body.message).toBe("All local data has been cleared.");
      expect(map.locations).toEqual([]);
      expect(map.worlds).toEqual([]);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
