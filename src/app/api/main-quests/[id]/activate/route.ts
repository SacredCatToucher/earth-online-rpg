import { revalidatePath } from "next/cache";
import { activateMainQuest, activateMainQuestInput } from "@/server/services/main-quest";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";

type Context = { params: Promise<{ id: string }> };

const serviceErrors = new Map<string, number>([
  ["Main Quest not found.", 404],
  ["Only draft Main Quests can be activated.", 409],
  ["This category already has an active Main Quest.", 409],
]);

function revalidateQuestDataPages() {
  for (const path of ["/", "/main-quests", "/adventure-log"]) {
    try {
      revalidatePath(path);
    } catch {
      // Route-handler tests do not provide Next's request cache context.
    }
  }
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const profileId = await resolveCurrentProfileIdFromRequest(request);
    const parsed = activateMainQuestInput.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Invalid Main Quest start date." }, { status: 400 });
    const quest = await activateMainQuest(id, parsed.data, profileId);
    revalidateQuestDataPages();
    return Response.json(quest);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = serviceErrors.get(message);
    if (status) return Response.json({ error: message }, { status });
    return Response.json({ error: "Main Quest could not be activated." }, { status: 500 });
  }
}
