import { revalidatePath } from "next/cache";
import { z } from "zod";
import { completeManualJournalEntry } from "@/server/services/adventure-log";

type Context = { params: Promise<{ id: string }> };

const completionInput = z.object({ completedDate: z.iso.date() });

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const input = completionInput.parse(await request.json());
    const entry = await completeManualJournalEntry(id, input.completedDate);
    for (const path of ["/", "/adventure-log", "/main-quests"]) {
      try {
        revalidatePath(path);
      } catch {
        // Route-handler tests do not provide Next's request cache context.
      }
    }
    return Response.json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The entry could not be completed.";
    return Response.json({ error: message }, { status: message.includes("not found") ? 404 : 400 });
  }
}
