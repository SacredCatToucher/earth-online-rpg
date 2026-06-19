import { db } from "@/lib/db";
import { deleteStoredAttachments, readStoredAttachment } from "@/server/storage/attachments";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(_: Request, context: Context) {
  const { id, attachmentId } = await context.params;
  const attachment = await db.attachment.findFirst({ where: { id: attachmentId, adventureLogId: id, adventureLog: { deletedAt: null } } });
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

export async function DELETE(_: Request, context: Context) {
  const { id, attachmentId } = await context.params;
  const attachment = await db.attachment.findFirst({ where: { id: attachmentId, adventureLogId: id } });
  if (!attachment) return Response.json({ error: "Attachment not found." }, { status: 404 });
  await db.attachment.delete({ where: { id: attachment.id } });
  await deleteStoredAttachments([attachment.storageName]);
  return new Response(null, { status: 204 });
}
