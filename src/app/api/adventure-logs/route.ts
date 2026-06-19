import { createManualJournalEntry } from "@/server/services/adventure-log";
import { listAdventureLogs } from "@/server/queries/adventure-log";
import { journalFormInput } from "@/app/api/adventure-logs/input";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  return Response.json(await listAdventureLogs({
    search: params.get("search") ?? undefined,
    type: params.get("type") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    page: Number(params.get("page")) || 1,
  }));
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const entry = await createManualJournalEntry(
      journalFormInput(form),
      form.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0),
    );
    return Response.json(entry, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Journal entry could not be created.";
    return Response.json({ error: message }, { status: 400 });
  }
}
