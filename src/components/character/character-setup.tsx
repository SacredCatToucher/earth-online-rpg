"use client";

import { FormEvent, useState } from "react";
import { profileFetch } from "@/lib/profiles";

export function CharacterSetup() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await profileFetch("/api/character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name") }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? "The character could not be created.");
      setPending(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="setup-backdrop" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <form className="setup-card pixel-panel" onSubmit={submit}>
        <p className="eyebrow">NEW ADVENTURE</p>
        <h1 id="setup-title">Who begins this journey?</h1>
        <p>Your world starts empty. Every meaningful step will leave a permanent mark here.</p>
        <label htmlFor="character-name">Character name</label>
        <input id="character-name" name="name" maxLength={40} autoFocus required />
        {error ? <p className="form-error">{error}</p> : null}
        <button className="pixel-button" type="submit" disabled={pending}>
          {pending ? "Creating world..." : "Begin adventure"}
        </button>
      </form>
    </div>
  );
}
