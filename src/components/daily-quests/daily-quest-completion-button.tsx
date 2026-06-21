"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DailyQuestCompletionButton({ id, completed }: { id: string; completed: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function updateCompletion() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/daily-quests/${id}/complete`, { method: completed ? "DELETE" : "POST" });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Today's step could not be updated.");
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className={`daily-completion-action ${completed ? "completed" : ""}`}>
      {completed ? <p><strong>Step taken.</strong> You moved this part of your journey forward today.</p> : null}
      <button type="button" onClick={updateCompletion} disabled={pending}>
        {pending ? "Updating..." : completed ? "Undo today's step" : "Mark today's step complete"}
      </button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  );
}
