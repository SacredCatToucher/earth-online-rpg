import { createManualJournalEntry } from "@/server/services/adventure-log";
import { listAdventureLogs } from "@/server/queries/adventure-log";
import { journalFormInput } from "@/app/api/adventure-logs/input";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const profileId = await resolveCurrentProfileIdFromRequest(request);
  return Response.json(await listAdventureLogs({
    profileId,
    search: params.get("search") ?? undefined,
    type: params.get("type") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    page: Number(params.get("page")) || 1,
  }));
}

export async function POST(request: Request) {
  try {
    const profileId = await resolveCurrentProfileIdFromRequest(request);
    const form = await request.formData();
    const entry = await createManualJournalEntry(
      journalFormInput(form),
      form.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0),
      profileId,
    );
    return Response.json(entry, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Journal entry could not be created.";
    return Response.json({ error: message }, { status: 400 });
  }
}
