"use client";

import { useState } from "react";

type ToolAction = "clear" | "reset-demo";

const copy = {
  clear: {
    confirmation: "This will delete current local data. This action cannot be undone. Continue?",
    pending: "Clearing local data...",
    success: "All local data has been cleared.",
    error: "Failed to clear local data. Please try again.",
  },
  "reset-demo": {
    confirmation: "This will delete current local data and rebuild demo data. This action cannot be undone. Continue?",
    pending: "Resetting demo data...",
    success: "Demo data has been reset.",
    error: "Failed to reset demo data. Please try again.",
  },
} satisfies Record<ToolAction, { confirmation: string; pending: string; success: string; error: string }>;

async function readDeveloperToolResponse(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as { message?: string; error?: string };
  } catch {
    return {};
  }
}

export function DeveloperTools() {
  const [status, setStatus] = useState("");
  const [pendingAction, setPendingAction] = useState<ToolAction | null>(null);

  async function runAction(action: ToolAction) {
    if (!window.confirm(copy[action].confirmation)) return;
    setPendingAction(action);
    setStatus(copy[action].pending);
    try {
      const response = await fetch("/api/developer-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await readDeveloperToolResponse(response);
      if (!response.ok) {
        setStatus(result.error ?? copy[action].error);
        setPendingAction(null);
        return;
      }
      setStatus(`${result.message ?? copy[action].success} Reloading...`);
      setPendingAction(null);
      window.setTimeout(() => window.location.replace("/"), 50);
    } catch {
      setStatus(copy[action].error);
      setPendingAction(null);
    }
  }

  return (
    <section className="developer-tools pixel-panel" aria-labelledby="developer-tools-title">
      <div>
        <p className="eyebrow">Developer Tools</p>
        <h2 id="developer-tools-title">Local testing controls</h2>
        <p>Tools for local testing and development.</p>
      </div>
      <div className="danger-zone" aria-label="Danger Zone">
        <div>
          <h3>Danger Zone</h3>
          <p>These actions can delete or rebuild local data. Use them carefully.</p>
        </div>
        <article>
          <div>
            <strong>Clear all data</strong>
            <p>Delete current local test data and return the app to an empty state. Useful for testing new-user and first-minute flows.</p>
          </div>
          <button className="danger-button" type="button" onClick={() => runAction("clear")} disabled={pendingAction !== null}>
            Clear all data
          </button>
        </article>
        <article>
          <div>
            <strong>Reset demo data</strong>
            <p>Delete current local data and rebuild demo data for testing Main Quest, Phase, Daily Quest, Adventure Log, World Map, and Life Worlds.</p>
          </div>
          <button className="text-button" type="button" onClick={() => runAction("reset-demo")} disabled={pendingAction !== null}>
            Reset demo data
          </button>
        </article>
        <span className="developer-tools-status" aria-live="polite">{status}</span>
      </div>
    </section>
  );
}
