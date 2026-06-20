import { activateMainQuest, activateMainQuestInput } from "@/server/services/main-quest";

type Context = { params: Promise<{ id: string }> };

const serviceErrors = new Map<string, number>([
  ["Main Quest not found.", 404],
  ["Only draft Main Quests can be activated.", 409],
  ["This category already has an active Main Quest.", 409],
]);

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const parsed = activateMainQuestInput.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Invalid Main Quest start date." }, { status: 400 });
    return Response.json(await activateMainQuest(id, parsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = serviceErrors.get(message);
    if (status) return Response.json({ error: message }, { status });
    return Response.json({ error: "Main Quest could not be activated." }, { status: 500 });
  }
}
