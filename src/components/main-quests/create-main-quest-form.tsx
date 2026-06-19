"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CategoryOption = { id: string; title: string };

export function CreateMainQuestForm({ categories }: { categories: CategoryOption[] }) {
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const startDate = String(data.get("startDate") ?? "");
    const response = await fetch("/api/main-quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: data.get("categoryId"),
        title: data.get("title"),
        description: data.get("description"),
        status: data.get("status"),
        progressType: data.get("progressType"),
        targetValue: Number(data.get("targetValue")),
        currentValue: Number(data.get("currentValue")),
        unit: data.get("unit"),
        ...(startDate ? { startDate } : {}),
      }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "The Main Quest could not be created.");
      setPending(false);
      return;
    }
    form.current?.reset();
    setPending(false);
    router.refresh();
  }

  return (
    <form className="main-quest-form pixel-panel" ref={form} onSubmit={submit}>
      <div className="quest-form-heading">
        <div><p className="eyebrow">NEW CAMPAIGN</p><h2>Create Main Quest</h2></div>
        <p>Begin a long-term objective and give it a permanent root in your Adventure Log.</p>
      </div>
      <div className="main-quest-form-grid">
        <label>Category<select name="categoryId" required>{categories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></label>
        <label>Status<select name="status" defaultValue="DRAFT"><option value="DRAFT">Draft</option><option value="ACTIVE">Active</option></select></label>
        <label className="quest-title-field">Quest title<input name="title" maxLength={120} required /></label>
        <label className="quest-description-field">Description<textarea name="description" maxLength={20000} rows={5} /></label>
        <label>Progress type<select name="progressType" defaultValue="PERCENTAGE"><option value="PERCENTAGE">Percentage</option><option value="COUNT">Count</option></select></label>
        <label>Unit<input name="unit" defaultValue="%" maxLength={20} required /></label>
        <label>Current value<input name="currentValue" type="number" min={0} defaultValue={0} required /></label>
        <label>Target value<input name="targetValue" type="number" min={1} defaultValue={100} required /></label>
        <label>Start date<input name="startDate" type="date" /></label>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="pixel-button quest-submit" type="submit" disabled={pending || !categories.length}>{pending ? "Creating quest..." : "Create Main Quest"}</button>
    </form>
  );
}
