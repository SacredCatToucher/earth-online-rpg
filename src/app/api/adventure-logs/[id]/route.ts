import { db } from "@/lib/db";
import { softDeleteAdventureEntry, updateManualJournalEntry } from "@/server/services/adventure-log";
import { journalFormInput } from "@/app/api/adventure-logs/input";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const profileId = await resolveCurrentProfileIdFromRequest(request);
  if (!profileId) return Response.json({ error: "Journal entry not found." }, { status: 404 });
  const entry = await db.adventureLog.findFirst({
    where: { id, profileId, deletedAt: null },
    include: {
      attachments: true,
      parent: { select: { id: true, title: true } },
      children: { where: { deletedAt: null }, select: { id: true, title: true, status: true }, orderBy: { startDate: "asc" } },
    },
  });
  return entry ? Response.json(entry) : Response.json({ error: "Journal entry not found." }, { status: 404 });
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const form = await request.formData();
    const entry = await updateManualJournalEntry(
      id,
      journalFormInput(form),
      form.getAll("attachments").filter((item): item is File => item instanceof File && item.size > 0),
      await resolveCurrentProfileIdFromRequest(request),
    );
    return Response.json(entry);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Journal entry could not be updated.";
    return Response.json({ error: message }, { status: message.includes("not found") ? 404 : 400 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;
  try {
    await softDeleteAdventureEntry(id, await resolveCurrentProfileIdFromRequest(request));
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Journal entry not found." }, { status: 404 });
  }
}
