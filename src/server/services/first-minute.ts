import { z } from "zod";
import { db } from "@/lib/db";
import { requireCurrentProfileId } from "@/server/services/profiles";

export const firstMinuteInput = z.object({
  moments: z.array(z.string().trim().min(1).max(120)).length(3),
});

export type FirstMinuteInput = z.input<typeof firstMinuteInput>;

export async function createFirstMinuteMap(input: FirstMinuteInput, profileId?: string | null) {
  const parsed = firstMinuteInput.parse(input);
  const now = new Date();

  return db.$transaction(async (tx) => {
    const currentProfileId = await requireCurrentProfileId(profileId, tx);
    if (!(await tx.character.count())) {
      await tx.character.create({ data: { name: "Adventurer" } });
    }

    const entries = [];
    for (const [index, title] of parsed.moments.entries()) {
      const eventDate = new Date(now);
      eventDate.setDate(now.getDate() + index);
      const location = await tx.mapLocation.create({
        data: {
          profileId: currentProfileId,
          title,
          eventDate,
          description: "A meaningful moment from your real life.",
          locationType: "JOURNAL_MILESTONE",
          positionX: 10 + index * 20,
          positionY: 14,
        },
      });
      entries.push(await tx.adventureLog.create({
        data: {
          profileId: currentProfileId,
          eventType: "MANUAL_JOURNAL_ENTRY",
          title,
          description: "A meaningful moment from your real life.",
          eventDate,
          startDate: eventDate,
          endDate: eventDate,
          status: "COMPLETED",
          origin: "MANUAL",
          locationId: location.id,
        },
      }));
    }
    return entries;
  });
}
