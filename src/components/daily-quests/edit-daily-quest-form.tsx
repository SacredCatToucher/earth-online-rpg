"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DAILY_QUEST_WEEKDAYS, parseDailyQuestWeekdays, type DailyQuestWeekday } from "@/lib/daily-quest";

type EditableDailyQuest = {
  id: string;
  title: string;
  description: string;
  daysOfWeek: string;
  isActive: boolean;
};

export function EditDailyQuestForm({ quest }: { quest: EditableDailyQuest }) {
  const router = useRouter();
  const [weekdays, setWeekdays] = useState<DailyQuestWeekday[]>(parseDailyQuestWeekdays(quest.daysOfWeek));
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
      }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "The Daily Quest could not be updated.");
      setPending(false);
      return;
    }
    setPending(false);
    router.refresh();
  }

  return (
    <details className="daily-edit">
      <summary>Edit quest</summary>
      <form className="daily-edit-form" onSubmit={submit}>
        <label>Quest title<input name="title" defaultValue={quest.title} maxLength={120} required /></label>
        <label>Description<textarea name="description" defaultValue={quest.description} maxLength={20000} rows={4} /></label>
        <fieldset className="weekday-picker compact"><legend>Repeat days</legend>{DAILY_QUEST_WEEKDAYS.map((day) => <label key={day}><input type="checkbox" checked={weekdays.includes(day)} onChange={(event) => toggleWeekday(day, event.target.checked)} /><span>{day}</span></label>)}</fieldset>
        <label className="daily-active-toggle compact"><input name="isActive" type="checkbox" value="true" defaultChecked={quest.isActive} /><span><strong>Active quest</strong></span></label>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button type="submit" disabled={pending}>{pending ? "Saving..." : "Save changes"}</button>
      </form>
    </details>
  );
}
