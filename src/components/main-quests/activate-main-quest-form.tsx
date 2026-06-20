"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { localDateInputValue } from "@/lib/dates";

export function ActivateMainQuestForm({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/main-quests/${id}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: data.get("startDate") }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "The Main Quest could not be activated.");
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <form className="quest-activate-form" onSubmit={submit}>
      <label>Start date<input name="startDate" type="date" defaultValue={localDateInputValue()} required /></label>
      <button type="submit" disabled={pending}>{pending ? "Activating..." : "Activate Main Quest"}</button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
