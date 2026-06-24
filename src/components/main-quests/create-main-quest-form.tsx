"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";

type CategoryOption = { id: string; title: string };

export function CreateMainQuestForm({ categories }: { categories: CategoryOption[] }) {
  const { t } = useLanguage();
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
        placeRootOnWorldMap: data.get("placeRootOnWorldMap") === "true",
        ...(startDate ? { startDate } : {}),
      }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? t("mainQuest.createError"));
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
        <div><p className="eyebrow">{t("mainQuest.newCampaign")}</p><h2>{t("mainQuest.create")}</h2></div>
        <p>{t("mainQuest.createDescription")}</p>
      </div>
      <div className="main-quest-form-grid">
        <label>{t("mainQuest.category")}<select name="categoryId" required>{categories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></label>
        <label>{t("mainQuest.status")}<select name="status" defaultValue="DRAFT"><option value="DRAFT">{t("common.draft")}</option><option value="ACTIVE">{t("worldMap.active")}</option></select></label>
        <label className="quest-title-field">{t("mainQuest.questTitle")}<input name="title" maxLength={120} required /></label>
        <label className="quest-description-field">{t("mainQuest.descriptionLabel")}<textarea name="description" maxLength={20000} rows={5} /></label>
        <label>{t("mainQuest.progressType")}<select name="progressType" defaultValue="PERCENTAGE"><option value="PERCENTAGE">{t("mainQuest.percentage")}</option><option value="COUNT">{t("mainQuest.count")}</option></select></label>
        <label>{t("mainQuest.unit")}<input name="unit" defaultValue="%" maxLength={20} required /></label>
        <label>{t("mainQuest.currentValue")}<input name="currentValue" type="number" min={0} defaultValue={0} required /></label>
        <label>{t("mainQuest.targetValue")}<input name="targetValue" type="number" min={1} defaultValue={100} required /></label>
        <label>{t("mainQuest.startDate")}<input name="startDate" type="date" /></label>
        <label className="milestone-toggle quest-root-map-toggle"><input name="placeRootOnWorldMap" type="checkbox" value="true" /><span><strong>{t("mainQuest.placeRoot")}</strong><small>{t("mainQuest.placeRootHelp")}</small></span></label>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="pixel-button quest-submit" type="submit" disabled={pending || !categories.length}>{pending ? t("mainQuest.creating") : t("mainQuest.create")}</button>
    </form>
  );
}
