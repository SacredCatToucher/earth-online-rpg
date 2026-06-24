"use client";

import { FormEvent, useState } from "react";
import { useLanguage } from "@/components/i18n/language-provider";

export function FirstMinuteMapForm() {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const moments = ["moment1", "moment2", "moment3"].map((name) => String(form.get(name) ?? "").trim());
    if (moments.some((moment) => !moment)) {
      setError(t("firstMinute.error"));
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
      setError(body.error ?? t("firstMinute.error"));
      setPending(false);
      return;
    }
    window.location.replace(`/?world=${encodeURIComponent(body.worldId)}`);
  }

  return (
    <section className="first-minute-panel" aria-labelledby="first-minute-title">
      <div>
        <p className="eyebrow">{t("firstMinute.eyebrow")}</p>
        <h3 id="first-minute-title">{t("firstMinute.title")}</h3>
        <p>{t("firstMinute.description")}</p>
      </div>
      <form className="first-minute-form" onSubmit={submit}>
        <label>{t("firstMinute.moment1")}<input name="moment1" maxLength={120} placeholder={t("firstMinute.placeholder1")} required /></label>
        <label>{t("firstMinute.moment2")}<input name="moment2" maxLength={120} placeholder={t("firstMinute.placeholder2")} required /></label>
        <label>{t("firstMinute.moment3")}<input name="moment3" maxLength={120} placeholder={t("firstMinute.placeholder3")} required /></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="pixel-button" type="submit" disabled={pending}>{pending ? t("firstMinute.loading") : t("firstMinute.submit")}</button>
      </form>
    </section>
  );
}
