"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";
import { DAILY_QUEST_WEEKDAYS, parseDailyQuestWeekdays, type DailyQuestWeekday } from "@/lib/daily-quest";

type EditableDailyQuest = {
  id: string;
  title: string;
  description: string;
  daysOfWeek: string;
  isActive: boolean;
  contributionEnabled: boolean;
  weeklyTargetAmount: number | null;
  contributionUnit: string | null;
  defaultContributionAmount: number | null;
};

export function EditDailyQuestForm({ quest }: { quest: EditableDailyQuest }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [weekdays, setWeekdays] = useState<DailyQuestWeekday[]>(parseDailyQuestWeekdays(quest.daysOfWeek));
  const [contributionEnabled, setContributionEnabled] = useState(quest.contributionEnabled);
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
    const response = await fetch(`/api/daily-quests/${quest.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        description: data.get("description"),
        weekdays,
        isActive: data.get("isActive") === "true",
        contributionEnabled,
        weeklyTargetAmount: contributionEnabled ? data.get("weeklyTargetAmount") : null,
        contributionUnit: contributionEnabled ? data.get("contributionUnit") : "",
        defaultContributionAmount: contributionEnabled ? data.get("defaultContributionAmount") : null,
      }),
    });
    await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(t("daily.updateError"));
      setPending(false);
      return;
    }
    setPending(false);
    router.refresh();
  }

  return (
    <details className="daily-edit">
      <summary>{t("daily.edit")}</summary>
      <form className="daily-edit-form" onSubmit={submit}>
        <label>{t("daily.questTitle")}<input name="title" defaultValue={quest.title} maxLength={120} required /></label>
        <label>{t("daily.descriptionLabel")}<textarea name="description" defaultValue={quest.description} maxLength={20000} rows={4} /></label>
        <fieldset className="weekday-picker compact"><legend>{t("daily.repeatDays")}</legend>{DAILY_QUEST_WEEKDAYS.map((day) => <label key={day}><input type="checkbox" checked={weekdays.includes(day)} onChange={(event) => toggleWeekday(day, event.target.checked)} /><span>{day}</span></label>)}</fieldset>
        <label className="daily-active-toggle compact"><input name="isActive" type="checkbox" value="true" defaultChecked={quest.isActive} /><span><strong>{t("daily.activeQuest")}</strong></span></label>
        <label className="daily-active-toggle compact"><input name="contributionEnabled" type="checkbox" value="true" checked={contributionEnabled} onChange={(event) => setContributionEnabled(event.target.checked)} /><span><strong>{t("daily.enableContribution")}</strong></span></label>
        {contributionEnabled ? (
          <div className="daily-contribution-fields compact">
            <label>{t("daily.weeklyTarget")}<input name="weeklyTargetAmount" type="number" min="0.01" step="0.01" defaultValue={quest.weeklyTargetAmount ?? ""} required /></label>
            <label>{t("daily.unit")}<input name="contributionUnit" maxLength={20} defaultValue={quest.contributionUnit ?? ""} required /></label>
            <label>{t("daily.defaultContribution")}<input name="defaultContributionAmount" type="number" min="0.01" step="0.01" defaultValue={quest.defaultContributionAmount ?? ""} required /></label>
          </div>
        ) : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button type="submit" disabled={pending}>{pending ? t("daily.saving") : t("daily.saveChanges")}</button>
      </form>
    </details>
  );
}
