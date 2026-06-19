"use client";

import { ChangeEvent, useRef, useState } from "react";

export function BackupControls() {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");

  async function restore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!window.confirm("Restore this backup? Current local data will be replaced.")) return;
    setStatus("Validating backup...");
    const body = new FormData();
    body.append("backup", file);
    const response = await fetch("/api/backup", { method: "POST", body });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setStatus(result.error ?? "Restore failed.");
      return;
    }
    setStatus("Restore complete. Reloading...");
    window.location.reload();
  }

  return (
    <div className="backup-actions">
      <a className="text-button" href="/api/backup">Export backup</a>
      <button className="text-button" type="button" onClick={() => input.current?.click()}>Restore</button>
      <input ref={input} className="sr-only" type="file" accept=".zip,application/zip" onChange={restore} />
      <span className="backup-status" aria-live="polite">{status}</span>
    </div>
  );
}
