import { revalidatePath } from "next/cache";
import { listDailyQuests } from "@/server/queries/daily-quest";
import { createDailyQuest, dailyQuestInput } from "@/server/services/daily-quest";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    return Response.json(await listDailyQuests(await resolveCurrentProfileIdFromRequest(request)));
  } catch {
    return Response.json({ error: "Daily Quests could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profileId = await resolveCurrentProfileIdFromRequest(request);
    const parsed = dailyQuestInput.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Invalid Daily Quest input." }, { status: 400 });
    const quest = await createDailyQuest(parsed.data, profileId);
    revalidatePath("/daily-quests");
    return Response.json(quest, { status: 201 });
  } catch {
    return Response.json({ error: "Daily Quest could not be created." }, { status: 500 });
  }
}
