import path from "node:path";

const root = path.resolve(process.env.RPG_DATA_DIR ?? "data");

export const dataPaths = {
  root,
  database: path.join(root, "app.db"),
  uploads: path.join(root, "uploads"),
  work: path.join(root, ".work"),
};

export function assertInsideDataRoot(candidate: string) {
  const resolved = path.resolve(candidate);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Storage path escaped the application data directory.");
  }
  return resolved;
}
