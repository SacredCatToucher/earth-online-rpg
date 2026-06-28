import { revalidatePath } from "next/cache";
import { z } from "zod";
import { completeMainQuest } from "@/server/services/main-quest";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";

type Context = { params: Promise<{ id: string }> };

const completionInput = z.object({ completedDate: z.iso.date().optional() });
const serviceErrors = new Map<string, number>([
  ["Main Quest not found.", 404],
  ["Only active Main Quests can be completed.", 409],
  ["Completion date cannot be before the Main Quest start date.", 400],
  ["Completion date cannot be before the root Adventure Log start date.", 400],
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
    const parsed = completionInput.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: "Invalid Main Quest completion date." }, { status: 400 });
    const result = await completeMainQuest(id, parsed.data.completedDate, profileId);
    revalidateQuestDataPages();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = serviceErrors.get(message);
    if (status) return Response.json({ error: message }, { status });
    return Response.json({ error: "Main Quest could not be completed." }, { status: 500 });
  }
}
