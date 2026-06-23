import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { db } from "../../src/lib/db";
import { listWorldMap, WIDER_JOURNEY_WORLD_ID } from "../../src/server/queries/world-map";
import { clearAllLocalData } from "../../src/server/services/developer-tools";
import { POST } from "../../src/app/api/first-minute/route";

async function requestFirstMinute(moments: string[]) {
  return POST(new Request("http://localhost/api/first-minute", {
    method: "POST",
    body: JSON.stringify({ moments }),
  }));
}

describe("First Minute Experience", () => {
  afterAll(async () => {
    await clearAllLocalData();
    await db.$disconnect();
  });

  it("creates three ordered Wider Journey map nodes from important moments", async () => {
    await clearAllLocalData();
    const moments = [
      "Started learning programming",
      "Finished my first project",
      "Decided to build RPG Life",
    ];

    const response = await requestFirstMinute(moments);
    const body = await response.json() as { worldId?: string };
    const map = await listWorldMap();
    const widerJourney = map.worlds.find((world) => world.id === WIDER_JOURNEY_WORLD_ID);

    expect(response.status).toBe(201);
    expect(body.worldId).toBe(WIDER_JOURNEY_WORLD_ID);
    expect(await db.character.count()).toBe(1);
    expect(await db.mainQuest.count()).toBe(0);
    expect(await db.adventureLog.count()).toBe(3);
    expect(await db.mapLocation.count()).toBe(3);
    expect(widerJourney?.locations.map((location) => location.title)).toEqual(moments);
    expect(widerJourney?.connections).toContainEqual({
      sourceId: widerJourney?.locations[0].id,
      targetId: widerJourney?.locations[1].id,
      kind: "CHRONOLOGICAL",
    });
    expect(widerJourney?.connections).toContainEqual({
      sourceId: widerJourney?.locations[1].id,
      targetId: widerJourney?.locations[2].id,
      kind: "CHRONOLOGICAL",
    });
  });

  it("rejects blank moments without creating content", async () => {
    await clearAllLocalData();

    const response = await requestFirstMinute(["Started learning programming", " ", "Decided to build RPG Life"]);
    const body = await response.json() as { error?: string };

    expect(response.status).toBe(400);
    expect(body.error).toBe("All three moments are required.");
    expect(await db.adventureLog.count()).toBe(0);
    expect(await db.mapLocation.count()).toBe(0);
  });
});
