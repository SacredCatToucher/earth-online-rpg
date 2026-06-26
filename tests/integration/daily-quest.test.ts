import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../../src/lib/db";
import {
  canonicalDailyQuestDate,
  DAILY_QUEST_WEEKDAYS,
  dailyQuestWeekRange,
  dailyQuestWeekday,
  type DailyQuestWeekday,
} from "../../src/lib/daily-quest";
import { listDailyQuests } from "../../src/server/queries/daily-quest";
import {
  completeDailyQuestToday,
  createDailyQuest,
  undoDailyQuestCompletionToday,
  updateDailyQuest,
} from "../../src/server/services/daily-quest";

const marker = `Phase 5 Daily Quest test ${randomUUID()}`;

function todayWeekdays(): DailyQuestWeekday[] {
  return [dailyQuestWeekday()];
}

function anotherWeekday(): DailyQuestWeekday {
  return DAILY_QUEST_WEEKDAYS.find((day) => day !== dailyQuestWeekday())!;
}

afterAll(async () => {
  await db.dailyQuest.deleteMany({ where: { title: { startsWith: marker } } });
  await db.$disconnect();
});

describe("Daily Quest foundation", () => {
  it("creates a definition with canonical repeat days and no EXP reward", async () => {
    const quest = await createDailyQuest({
      title: `${marker} canonical cadence`,
      description: "A repeated real-life action.",
      weekdays: ["SUN", "MON", "FRI", "MON"],
    });

    expect(quest.daysOfWeek).toBe("MON,FRI,SUN");
    expect(quest.expReward).toBe(0);
    expect(quest.isActive).toBe(true);
    expect(quest.contributionEnabled).toBe(false);
    expect(quest.weeklyTargetAmount).toBeNull();
  });

  it("creates and edits progress contribution settings", async () => {
    const quest = await createDailyQuest({
      title: `${marker} progress settings`,
      description: "Run toward a weekly target.",
      weekdays: todayWeekdays(),
      contributionEnabled: true,
      weeklyTargetAmount: 20,
      contributionUnit: "km",
      defaultContributionAmount: 3,
    });

    expect(quest.contributionEnabled).toBe(true);
    expect(quest.weeklyTargetAmount).toBe(20);
    expect(quest.contributionUnit).toBe("km");
    expect(quest.defaultContributionAmount).toBe(3);

    const updated = await updateDailyQuest(quest.id, {
      title: `${marker} progress settings updated`,
      weekdays: todayWeekdays(),
      contributionEnabled: false,
    });

    expect(updated.contributionEnabled).toBe(false);
    expect(updated.weeklyTargetAmount).toBeNull();
    expect(updated.contributionUnit).toBeNull();
    expect(updated.defaultContributionAmount).toBeNull();
  });

  it("validates progress contribution settings only when enabled", async () => {
    await expect(
      createDailyQuest({
        title: `${marker} invalid progress settings`,
        weekdays: todayWeekdays(),
        contributionEnabled: true,
        weeklyTargetAmount: 0,
        contributionUnit: "",
        defaultContributionAmount: 0,
      }),
    ).rejects.toThrow();

    await expect(
      createDailyQuest({
        title: `${marker} disabled progress blank settings`,
        weekdays: todayWeekdays(),
        contributionEnabled: false,
        weeklyTargetAmount: null,
        contributionUnit: "",
        defaultContributionAmount: null,
      }),
    ).resolves.toMatchObject({ contributionEnabled: false });
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

describe("Daily Quest completion foundation", () => {
  it("completes an active quest for today with a canonical date and no EXP", async () => {
    const quest = await createDailyQuest({ title: `${marker} complete today`, weekdays: todayWeekdays() });

    const completion = await completeDailyQuestToday(quest.id);

    expect(completion.questDate).toBe(canonicalDailyQuestDate());
    expect(completion.questDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(completion.expAwarded).toBe(0);
    expect(completion.contributionAmount).toBeNull();
    expect(await db.dailyQuestCompletion.count({ where: { dailyQuestId: quest.id } })).toBe(1);
    const listed = (await listDailyQuests()).find((item) => item.id === quest.id);
    expect(listed).toMatchObject({ isScheduledToday: true, isCompletedToday: true });
  });

  it("completes a progress quest with a contribution amount and updates this week's total", async () => {
    const quest = await createDailyQuest({
      title: `${marker} progress completion`,
      weekdays: todayWeekdays(),
      contributionEnabled: true,
      weeklyTargetAmount: 20,
      contributionUnit: "km",
      defaultContributionAmount: 3,
    });

    const completion = await completeDailyQuestToday(quest.id, { contributionAmount: 5 });
    const listed = (await listDailyQuests()).find((item) => item.id === quest.id);

    expect(completion.contributionAmount).toBe(5);
    expect(completion.weeklyProgressAmount).toBe(5);
    expect(listed).toMatchObject({
      isCompletedToday: true,
      todayContributionAmount: 5,
      weeklyProgressAmount: 5,
      contributionEnabled: true,
      weeklyTargetAmount: 20,
      contributionUnit: "km",
      defaultContributionAmount: 3,
    });
  });

  it("sums only contribution records in the current Monday-through-Sunday week", async () => {
    const quest = await createDailyQuest({
      title: `${marker} weekly sum`,
      weekdays: todayWeekdays(),
      contributionEnabled: true,
      weeklyTargetAmount: 20,
      contributionUnit: "km",
      defaultContributionAmount: 3,
    });
    const week = dailyQuestWeekRange();
    const beforeWeek = new Date(`${week.start}T00:00:00.000`);
    beforeWeek.setDate(beforeWeek.getDate() - 1);
    await db.dailyQuestCompletion.create({
      data: {
        dailyQuestId: quest.id,
        questDate: canonicalDailyQuestDate(beforeWeek),
        expAwarded: 0,
        contributionAmount: 99,
      },
    });

    await completeDailyQuestToday(quest.id, { contributionAmount: 4 });
    const listed = (await listDailyQuests()).find((item) => item.id === quest.id);

    expect(listed?.weeklyProgressAmount).toBe(4);
  });

  it("requires a contribution amount for progress quest completion", async () => {
    const quest = await createDailyQuest({
      title: `${marker} missing contribution`,
      weekdays: todayWeekdays(),
      contributionEnabled: true,
      weeklyTargetAmount: 10,
      contributionUnit: "km",
      defaultContributionAmount: 2,
    });

    await expect(completeDailyQuestToday(quest.id)).rejects.toThrow("Contribution amount must be greater than 0.");
    expect(await db.dailyQuestCompletion.count({ where: { dailyQuestId: quest.id } })).toBe(0);
  });

  it("rejects duplicate completion without adding another record", async () => {
    const quest = await createDailyQuest({ title: `${marker} duplicate`, weekdays: todayWeekdays() });
    await completeDailyQuestToday(quest.id);

    await expect(completeDailyQuestToday(quest.id)).rejects.toThrow("Daily Quest is already completed today.");
    expect(await db.dailyQuestCompletion.count({ where: { dailyQuestId: quest.id } })).toBe(1);
  });

  it("rejects completion for paused and unscheduled quests", async () => {
    const paused = await createDailyQuest({ title: `${marker} paused completion`, weekdays: todayWeekdays(), isActive: false });
    const unscheduled = await createDailyQuest({ title: `${marker} unscheduled`, weekdays: [anotherWeekday()] });

    await expect(completeDailyQuestToday(paused.id)).rejects.toThrow("Paused Daily Quests cannot be completed.");
    await expect(completeDailyQuestToday(unscheduled.id)).rejects.toThrow("Daily Quest is not scheduled for today.");
    expect(await db.dailyQuestCompletion.count({ where: { dailyQuestId: { in: [paused.id, unscheduled.id] } } })).toBe(0);
  });

  it("undoes only today's completion and clearly rejects a repeated undo", async () => {
    const quest = await createDailyQuest({ title: `${marker} undo`, weekdays: todayWeekdays() });
    await completeDailyQuestToday(quest.id);

    const removed = await undoDailyQuestCompletionToday(quest.id);

    expect(removed.questDate).toBe(canonicalDailyQuestDate());
    expect(await db.dailyQuestCompletion.count({ where: { dailyQuestId: quest.id } })).toBe(0);
    await expect(undoDailyQuestCompletionToday(quest.id)).rejects.toThrow("Daily Quest has no completion to undo today.");
  });

  it("allows today's completion to be undone after the quest is paused", async () => {
    const quest = await createDailyQuest({ title: `${marker} pause after completion`, weekdays: todayWeekdays() });
    await completeDailyQuestToday(quest.id);
    await updateDailyQuest(quest.id, {
      title: quest.title,
      description: quest.description,
      weekdays: todayWeekdays(),
      isActive: false,
    });

    await expect(undoDailyQuestCompletionToday(quest.id)).resolves.toMatchObject({ dailyQuestId: quest.id });
  });

  it("creates no journey, map, EXP, reward, achievement, or skill side effects", async () => {
    const countsBefore = {
      adventureLogs: await db.adventureLog.count(),
      mapLocations: await db.mapLocation.count(),
      expTransactions: await db.expTransaction.count(),
      rewards: await db.reward.count(),
      achievements: await db.achievement.count(),
      skillRecords: await db.skillRecord.count(),
    };
    const quest = await createDailyQuest({ title: `${marker} isolated completion`, weekdays: todayWeekdays() });

    await completeDailyQuestToday(quest.id);
    await undoDailyQuestCompletionToday(quest.id);

    expect(await db.adventureLog.count()).toBe(countsBefore.adventureLogs);
    expect(await db.mapLocation.count()).toBe(countsBefore.mapLocations);
    expect(await db.expTransaction.count()).toBe(countsBefore.expTransactions);
    expect(await db.reward.count()).toBe(countsBefore.rewards);
    expect(await db.achievement.count()).toBe(countsBefore.achievements);
    expect(await db.skillRecord.count()).toBe(countsBefore.skillRecords);
  });

  it("reports a missing quest for completion and undo", async () => {
    await expect(completeDailyQuestToday("missing-daily-quest")).rejects.toThrow("Daily Quest not found.");
    await expect(undoDailyQuestCompletionToday("missing-daily-quest")).rejects.toThrow("Daily Quest not found.");
  });
});
