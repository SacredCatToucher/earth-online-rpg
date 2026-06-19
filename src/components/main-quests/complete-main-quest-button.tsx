"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { localDateInputValue } from "@/lib/dates";

export function CompleteMainQuestButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function complete() {
    if (!window.confirm("Complete this Main Quest today?")) return;
    setPending(true);
    setError("");
    const response = await fetch(`/api/main-quests/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedDate: localDateInputValue() }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "The Main Quest could not be completed.");
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="quest-complete-action">
      <button type="button" onClick={complete} disabled={pending}>{pending ? "Completing..." : "Complete Main Quest"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
