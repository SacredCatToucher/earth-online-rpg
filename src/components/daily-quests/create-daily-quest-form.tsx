"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";
import { DAILY_QUEST_WEEKDAYS, type DailyQuestWeekday } from "@/lib/daily-quest";

export function CreateDailyQuestForm() {
  const { t } = useLanguage();
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [weekdays, setWeekdays] = useState<DailyQuestWeekday[]>([...DAILY_QUEST_WEEKDAYS]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function toggleWeekday(day: DailyQuestWeekday, checked: boolean) {
    setWeekdays((current) => checked ? [...current, day] : current.filter((item) => item !== day));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/daily-quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        description: data.get("description"),
        weekdays,
        isActive: data.get("isActive") === "true",
      }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? t("daily.createError"));
      setPending(false);
      return;
    }
    form.current?.reset();
    setWeekdays([...DAILY_QUEST_WEEKDAYS]);
    setPending(false);
    router.refresh();
  }

  return (
    <form className="daily-quest-form pixel-panel" ref={form} onSubmit={submit}>
      <div className="daily-form-heading"><div><p className="eyebrow">{t("daily.newRitual")}</p><h2>{t("daily.create")}</h2></div><p>{t("daily.createDescription")}</p></div>
      <label>{t("daily.questTitle")}<input name="title" maxLength={120} required /></label>
      <label>{t("daily.descriptionLabel")}<textarea name="description" maxLength={20000} rows={4} /></label>
      <fieldset className="weekday-picker"><legend>{t("daily.repeatDays")}</legend>{DAILY_QUEST_WEEKDAYS.map((day) => <label key={day}><input type="checkbox" checked={weekdays.includes(day)} onChange={(event) => toggleWeekday(day, event.target.checked)} /><span>{day}</span></label>)}</fieldset>
      <label className="daily-active-toggle"><input name="isActive" type="checkbox" value="true" defaultChecked /><span><strong>{t("daily.activeQuest")}</strong><small>{t("daily.activeHelp")}</small></span></label>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="pixel-button daily-submit" type="submit" disabled={pending}>{pending ? t("daily.creating") : t("daily.create")}</button>
    </form>
  );
}
