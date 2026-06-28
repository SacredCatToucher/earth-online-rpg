import { revalidatePath } from "next/cache";
import { completeDailyQuestInput, completeDailyQuestToday, undoDailyQuestCompletionToday } from "@/server/services/daily-quest";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";

type Context = { params: Promise<{ id: string }> };

const serviceErrors = new Map<string, number>([
  ["Daily Quest not found.", 404],
  ["Paused Daily Quests cannot be completed.", 409],
  ["Daily Quest is not scheduled for today.", 409],
  ["Daily Quest is already completed today.", 409],
  ["Daily Quest has no completion to undo today.", 404],
  ["Contribution amount must be greater than 0.", 400],
]);

async function respond(action: () => Promise<unknown>, fallback: string) {
  try {
    const result = await action();
    revalidatePath("/daily-quests");
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = serviceErrors.get(message);
    if (status) return Response.json({ error: message }, { status });
    return Response.json({ error: fallback }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = completeDailyQuestInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid Daily Quest completion input." }, { status: 400 });
  const profileId = await resolveCurrentProfileIdFromRequest(request);
  return respond(() => completeDailyQuestToday(id, parsed.data, profileId), "Daily Quest could not be completed.");
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;
  const profileId = await resolveCurrentProfileIdFromRequest(request);
  return respond(() => undoDailyQuestCompletionToday(id, profileId), "Daily Quest completion could not be undone.");
}
