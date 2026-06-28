import { revalidatePath } from "next/cache";
import { dailyQuestInput, updateDailyQuest } from "@/server/services/daily-quest";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const parsed = dailyQuestInput.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Invalid Daily Quest input." }, { status: 400 });
    const quest = await updateDailyQuest(id, parsed.data, await resolveCurrentProfileIdFromRequest(request));
    revalidatePath("/daily-quests");
    return Response.json(quest);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Daily Quest not found.") return Response.json({ error: message }, { status: 404 });
    return Response.json({ error: "Daily Quest could not be updated." }, { status: 500 });
  }
}
