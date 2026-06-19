import { cp, mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import AdmZip from "adm-zip";
import archiver from "archiver";
import { BACKUP_FORMAT, BACKUP_VERSION } from "@/lib/constants";
import { db } from "@/lib/db";
import { assertInsideDataRoot, dataPaths } from "@/server/storage/paths";

type BackupManifest = {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: string;
};

async function prepareWorkDir(prefix: string) {
  await mkdir(dataPaths.work, { recursive: true });
  const directory = assertInsideDataRoot(path.join(dataPaths.work, `${prefix}-${randomUUID()}`));
  await mkdir(directory, { recursive: true });
  return directory;
}

export async function createBackupArchive() {
  const workDir = await prepareWorkDir("export");
  const snapshot = path.join(workDir, "app.db");
  const escaped = snapshot.replaceAll("'", "''");
  await db.$executeRawUnsafe(`VACUUM INTO '${escaped}'`);

  const manifest: BackupManifest = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
  };
  await writeFile(path.join(workDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.file(snapshot, { name: "app.db" });
  archive.file(path.join(workDir, "manifest.json"), { name: "manifest.json" });
  try {
    if ((await stat(dataPaths.uploads)).isDirectory()) archive.directory(dataPaths.uploads, "uploads");
  } catch {
    // An installation without uploads still produces a complete backup.
  }
  archive.on("end", () => void rm(workDir, { recursive: true, force: true }));
  void archive.finalize();
  return archive;
}

function validEntryName(name: string) {
  const normalized = name.replaceAll("\\", "/");
  return !path.posix.isAbsolute(normalized) && !normalized.split("/").includes("..");
}

export async function restoreBackupArchive(buffer: Buffer) {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  if (entries.some((entry) => !validEntryName(entry.entryName))) throw new Error("Backup contains unsafe paths.");

  const manifestEntry = zip.getEntry("manifest.json");
  const databaseEntry = zip.getEntry("app.db");
  if (!manifestEntry || !databaseEntry) throw new Error("Backup is missing its manifest or database.");

  const manifest = JSON.parse(manifestEntry.getData().toString("utf8")) as Partial<BackupManifest>;
  if (manifest.format !== BACKUP_FORMAT || manifest.version !== BACKUP_VERSION) {
    throw new Error("Backup format is not supported by this version.");
  }
  if (!databaseEntry.getData().subarray(0, 16).equals(Buffer.from("SQLite format 3\0"))) {
    throw new Error("Backup database is not a valid SQLite file.");
  }

  const stage = await prepareWorkDir("restore");
  const rollback = await prepareWorkDir("rollback");
  await writeFile(path.join(stage, "app.db"), databaseEntry.getData());
  for (const entry of entries.filter((item) => item.entryName.startsWith("uploads/") && !item.isDirectory)) {
    const relative = entry.entryName.slice("uploads/".length);
    const destination = assertInsideDataRoot(path.join(stage, "uploads", relative));
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, entry.getData());
  }

  await db.$disconnect();
  try {
    await cp(dataPaths.database, path.join(rollback, "app.db"));
    try {
      await cp(dataPaths.uploads, path.join(rollback, "uploads"), { recursive: true });
    } catch {}
    await rm(dataPaths.database, { force: true });
    await rename(path.join(stage, "app.db"), dataPaths.database);
    await rm(dataPaths.uploads, { recursive: true, force: true });
    try {
      await rename(path.join(stage, "uploads"), dataPaths.uploads);
    } catch {
      await mkdir(dataPaths.uploads, { recursive: true });
    }
  } catch (error) {
    await cp(path.join(rollback, "app.db"), dataPaths.database);
    try {
      await cp(path.join(rollback, "uploads"), dataPaths.uploads, { recursive: true });
    } catch {}
    throw error;
  } finally {
    await rm(stage, { recursive: true, force: true });
    await rm(rollback, { recursive: true, force: true });
  }

  return { restoredAt: new Date().toISOString() };
}
