import { completeDailyQuestToday, undoDailyQuestCompletionToday } from "@/server/services/daily-quest";

type Context = { params: Promise<{ id: string }> };

const serviceErrors = new Map<string, number>([
  ["Daily Quest not found.", 404],
  ["Paused Daily Quests cannot be completed.", 409],
  ["Daily Quest is not scheduled for today.", 409],
  ["Daily Quest is already completed today.", 409],
  ["Daily Quest has no completion to undo today.", 404],
]);

async function respond(action: () => Promise<unknown>, fallback: string) {
  try {
    return Response.json(await action());
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = serviceErrors.get(message);
    if (status) return Response.json({ error: message }, { status });
    return Response.json({ error: fallback }, { status: 500 });
  }
}

export async function POST(_request: Request, context: Context) {
  const { id } = await context.params;
  return respond(() => completeDailyQuestToday(id), "Daily Quest could not be completed.");
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  return respond(() => undoDailyQuestCompletionToday(id), "Daily Quest completion could not be undone.");
}
