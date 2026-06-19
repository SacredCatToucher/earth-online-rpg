import { Readable } from "node:stream";
import { createBackupArchive, restoreBackupArchive } from "@/server/services/backup";

export const runtime = "nodejs";

export async function GET() {
  const archive = await createBackupArchive();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="earth-online-rpg-${date}.zip"`,
    },
  });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const upload = form.get("backup");
  if (!(upload instanceof File)) return Response.json({ error: "A backup file is required." }, { status: 400 });
  if (upload.size > 2_000_000_000) return Response.json({ error: "Backup exceeds the 2 GB limit." }, { status: 413 });

  try {
    const result = await restoreBackupArchive(Buffer.from(await upload.arrayBuffer()));
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Restore failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
