import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../../src/lib/db";
import { listDailyQuests } from "../../src/server/queries/daily-quest";
import { createDailyQuest, updateDailyQuest } from "../../src/server/services/daily-quest";

const marker = `Phase 5 Daily Quest test ${randomUUID()}`;

describe("Daily Quest foundation", () => {
  afterAll(async () => {
    await db.dailyQuest.deleteMany({ where: { title: { startsWith: marker } } });
    await db.$disconnect();
  });

  it("creates a definition with canonical repeat days and no EXP reward", async () => {
    const quest = await createDailyQuest({
      title: `${marker} canonical cadence`,
      description: "A repeated real-life action.",
      weekdays: ["SUN", "MON", "FRI", "MON"],
    });

    expect(quest.daysOfWeek).toBe("MON,FRI,SUN");
    expect(quest.expReward).toBe(0);
    expect(quest.isActive).toBe(true);
  });

  it("rejects empty and invalid repeat patterns without creating definitions", async () => {
    const countBefore = await db.dailyQuest.count({ where: { title: { startsWith: marker } } });

    await expect(createDailyQuest({ title: `${marker} empty cadence`, weekdays: [] })).rejects.toThrow();
    await expect(
      createDailyQuest({ title: `${marker} invalid cadence`, weekdays: ["FUNDAY" as never] }),
    ).rejects.toThrow();

    expect(await db.dailyQuest.count({ where: { title: { startsWith: marker } } })).toBe(countBefore);
  });

  it("lists active definitions before paused definitions with deterministic title ordering", async () => {
    const activeB = await createDailyQuest({ title: `${marker} active B`, weekdays: ["TUE"], isActive: true });
    const activeA = await createDailyQuest({ title: `${marker} active A`, weekdays: ["MON"], isActive: true });
    const paused = await createDailyQuest({ title: `${marker} paused`, weekdays: ["WED"], isActive: false });

    const listed = (await listDailyQuests()).filter((quest) => quest.title.startsWith(marker));
    expect(listed.findIndex((quest) => quest.id === activeA.id)).toBeLessThan(listed.findIndex((quest) => quest.id === activeB.id));
    expect(listed.findIndex((quest) => quest.id === activeB.id)).toBeLessThan(listed.findIndex((quest) => quest.id === paused.id));
  });

  it("edits definition fields without creating completion, Adventure Log, or World Map records", async () => {
    const completionCount = await db.dailyQuestCompletion.count();
    const adventureLogCount = await db.adventureLog.count();
    const mapLocationCount = await db.mapLocation.count();
    const quest = await createDailyQuest({
      title: `${marker} before edit`,
      description: "Before.",
      weekdays: ["MON", "WED"],
      isActive: true,
    });

    const updated = await updateDailyQuest(quest.id, {
      title: `${marker} after edit`,
      description: "After.",
      weekdays: ["SAT", "TUE"],
      isActive: false,
    });

    expect(updated.title).toBe(`${marker} after edit`);
    expect(updated.description).toBe("After.");
    expect(updated.daysOfWeek).toBe("TUE,SAT");
    expect(updated.isActive).toBe(false);
    expect(updated.expReward).toBe(0);
    expect(await db.dailyQuestCompletion.count()).toBe(completionCount);
    expect(await db.adventureLog.count()).toBe(adventureLogCount);
    expect(await db.mapLocation.count()).toBe(mapLocationCount);
    await expect(
      updateDailyQuest("missing-daily-quest", { title: `${marker} missing`, weekdays: ["MON"] }),
    ).rejects.toThrow("Daily Quest not found.");
  });
});
