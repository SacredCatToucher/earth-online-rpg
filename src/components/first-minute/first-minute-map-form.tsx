"use client";

import { FormEvent, useState } from "react";

export function FirstMinuteMapForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const moments = ["moment1", "moment2", "moment3"].map((name) => String(form.get(name) ?? "").trim());
    if (moments.some((moment) => !moment)) {
      setError("Something went wrong while creating your first map. Please try again.");
      setPending(false);
      return;
    }

    const response = await fetch("/api/first-minute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moments }),
    });
    const body = (await response.json().catch(() => ({}))) as { worldId?: string; error?: string };
    if (!response.ok || !body.worldId) {
      setError(body.error ?? "Something went wrong while creating your first map. Please try again.");
      setPending(false);
      return;
    }
    window.location.replace(`/?world=${encodeURIComponent(body.worldId)}`);
  }

  return (
    <section className="first-minute-panel" aria-labelledby="first-minute-title">
      <div>
        <p className="eyebrow">FIRST JOURNEY</p>
        <h3 id="first-minute-title">Create your first life map</h3>
        <p>Write three important moments from your real life. We'll turn them into your first RPG journey.</p>
      </div>
      <form className="first-minute-form" onSubmit={submit}>
        <label>Moment 1<input name="moment1" maxLength={120} placeholder="Started learning programming" required /></label>
        <label>Moment 2<input name="moment2" maxLength={120} placeholder="Finished my first project" required /></label>
        <label>Moment 3<input name="moment3" maxLength={120} placeholder="Decided to build RPG Life" required /></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="pixel-button" type="submit" disabled={pending}>{pending ? "Building your first journey..." : "Create my first map"}</button>
      </form>
    </section>
  );
}
