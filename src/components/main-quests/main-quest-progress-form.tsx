"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function MainQuestProgressForm({ id, currentValue, targetValue, unit }: { id: string; currentValue: number; targetValue: number; unit: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/main-quests/${id}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentValue: Number(data.get("currentValue")) }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Main Quest progress could not be updated.");
      setPending(false);
      return;
    }
    setPending(false);
    router.refresh();
  }

  return (
    <form className="quest-progress-form" onSubmit={submit}>
      <label>Update progress<input name="currentValue" type="number" min={0} max={targetValue} defaultValue={currentValue} required /><span>{unit}</span></label>
      <button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
