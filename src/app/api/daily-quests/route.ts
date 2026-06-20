import { listDailyQuests } from "@/server/queries/daily-quest";
import { createDailyQuest, dailyQuestInput } from "@/server/services/daily-quest";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await listDailyQuests());
  } catch {
    return Response.json({ error: "Daily Quests could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = dailyQuestInput.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Invalid Daily Quest input." }, { status: 400 });
    return Response.json(await createDailyQuest(parsed.data), { status: 201 });
  } catch {
    return Response.json({ error: "Daily Quest could not be created." }, { status: 500 });
  }
}
