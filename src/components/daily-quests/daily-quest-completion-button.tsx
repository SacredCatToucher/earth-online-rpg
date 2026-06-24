"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";

export function DailyQuestCompletionButton({ id, completed }: { id: string; completed: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function updateCompletion() {
    setPending(true);
    setError("");
    const response = await fetch(`/api/daily-quests/${id}/complete`, { method: completed ? "DELETE" : "POST" });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? t("daily.completionError"));
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className={`daily-completion-action ${completed ? "completed" : ""}`}>
      {completed ? <p><strong>{t("daily.stepTaken")}</strong> {t("daily.stepTakenHelp")}</p> : null}
      <button type="button" onClick={updateCompletion} disabled={pending}>
        {pending ? t("daily.updating") : completed ? t("daily.undoToday") : t("daily.completeToday")}
      </button>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  );
}
