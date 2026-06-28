import { db } from "@/lib/db";
import { resolveCurrentProfileIdFromRequest } from "@/server/services/profiles";
import { deleteStoredAttachments, readStoredAttachment } from "@/server/storage/attachments";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(request: Request, context: Context) {
  const { id, attachmentId } = await context.params;
  const profileId = await resolveCurrentProfileIdFromRequest(request);
  if (!profileId) return Response.json({ error: "Attachment not found." }, { status: 404 });
  const attachment = await db.attachment.findFirst({ where: { id: attachmentId, adventureLogId: id, adventureLog: { profileId, deletedAt: null } } });
  if (!attachment) return Response.json({ error: "Attachment not found." }, { status: 404 });
  try {
    const bytes = await readStoredAttachment(attachment.storageName);
    const inline = attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf";
    const fallbackName = attachment.originalName.replace(/["\r\n]/g, "_");
    return new Response(bytes, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(bytes.length),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${fallbackName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "Attachment file is missing." }, { status: 404 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const { id, attachmentId } = await context.params;
  const profileId = await resolveCurrentProfileIdFromRequest(request);
  if (!profileId) return Response.json({ error: "Attachment not found." }, { status: 404 });
  const attachment = await db.attachment.findFirst({ where: { id: attachmentId, adventureLogId: id, adventureLog: { profileId } } });
  if (!attachment) return Response.json({ error: "Attachment not found." }, { status: 404 });
  await db.attachment.delete({ where: { id: attachment.id } });
  await deleteStoredAttachments([attachment.storageName]);
  return new Response(null, { status: 204 });
}
