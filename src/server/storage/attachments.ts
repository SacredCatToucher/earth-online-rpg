import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { dataPaths } from "@/server/storage/paths";

export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_ENTRY = 10;

const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/markdown": ".md",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.oasis.opendocument.text": ".odt",
};

export type StoredAttachment = {
  storageName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
};

function uploadPath(storageName: string) {
  const root = path.resolve(dataPaths.uploads);
  const candidate = path.resolve(root, storageName);
  if (!candidate.startsWith(`${root}${path.sep}`)) throw new Error("Attachment path escaped the upload directory.");
  return candidate;
}

export async function storeAttachments(files: File[]): Promise<StoredAttachment[]> {
  if (files.length > MAX_ATTACHMENTS_PER_ENTRY) throw new Error(`Attach no more than ${MAX_ATTACHMENTS_PER_ENTRY} files.`);
  const stored: StoredAttachment[] = [];
  try {
    for (const file of files) {
      const extension = allowedTypes[file.type];
      if (!extension) throw new Error(`${file.name}: unsupported file type.`);
      if (file.size === 0 || file.size > MAX_ATTACHMENT_BYTES) throw new Error(`${file.name}: file must be between 1 byte and 20 MB.`);
      const bytes = Buffer.from(await file.arrayBuffer());
      const now = new Date();
      const storageName = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}${extension}`;
      const destination = uploadPath(storageName);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, bytes, { flag: "wx" });
      stored.push({
        storageName,
        originalName: file.name.slice(0, 255),
        mimeType: file.type,
        sizeBytes: bytes.length,
        checksum: createHash("sha256").update(bytes).digest("hex"),
      });
    }
    return stored;
  } catch (error) {
    await deleteStoredAttachments(stored.map((item) => item.storageName));
    throw error;
  }
}

export async function readStoredAttachment(storageName: string) {
  return readFile(uploadPath(storageName));
}

export async function deleteStoredAttachments(storageNames: string[]) {
  await Promise.all(storageNames.map((name) => rm(uploadPath(name), { force: true })));
}
