"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";

type ContributionSettings = {
  enabled: boolean;
  weeklyTargetAmount: number | null;
  contributionUnit: string | null;
  defaultContributionAmount: number | null;
  weeklyProgressAmount: number;
  todayContributionAmount: number | null;
};

function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function DailyQuestCompletionButton({
  id,
  completed,
  contribution,
}: {
  id: string;
  completed: boolean;
  contribution?: ContributionSettings;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(completed);
  const [weeklyProgress, setWeeklyProgress] = useState(contribution?.weeklyProgressAmount ?? 0);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [contributionAmount, setContributionAmount] = useState(String(contribution?.defaultContributionAmount ?? 1));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isProgressQuest = Boolean(contribution?.enabled);
  const target = contribution?.weeklyTargetAmount ?? 0;
  const unit = contribution?.contributionUnit ?? "";
  const targetReached = isProgressQuest && target > 0 && weeklyProgress >= target;

  async function complete(amount?: number) {
    setPending(true);
    setError("");
    setMessage("");
    const response = await fetch(`/api/daily-quests/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isProgressQuest ? { contributionAmount: amount } : {}),
    });
    const body = (await response.json()) as { error?: string; weeklyProgressAmount?: number };
    if (!response.ok) {
      setError(body.error ?? t("daily.completionError"));
      setPending(false);
      return;
    }
    setIsCompleted(true);
    setShowContributionForm(false);
    if (typeof body.weeklyProgressAmount === "number") {
      setWeeklyProgress(body.weeklyProgressAmount);
      setMessage(body.weeklyProgressAmount >= target ? t("daily.weeklyTargetReachedMessage") : t("daily.progressAdded"));
    }
    router.refresh();
    setPending(false);
  }

  async function undo() {
    setPending(true);
    setError("");
    setMessage("");
    const previousTodayAmount = Number(contributionAmount) || contribution?.defaultContributionAmount || 0;
    const response = await fetch(`/api/daily-quests/${id}/complete`, { method: "DELETE" });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? t("daily.completionError"));
      setPending(false);
      return;
    }
    setIsCompleted(false);
    if (isProgressQuest) setWeeklyProgress((current) => Math.max(0, current - (contribution?.todayContributionAmount ?? previousTodayAmount)));
    router.refresh();
    setPending(false);
  }

  function updateCompletion() {
    if (isCompleted) {
      void undo();
      return;
    }
    if (isProgressQuest) {
      setShowContributionForm(true);
      setError("");
      return;
    }
    void complete();
  }

  function submitContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(contributionAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t("daily.contributionAmountRequired"));
      return;
    }
    void complete(amount);
  }

  return (
    <div className={`daily-completion-action ${isCompleted ? "completed" : ""}`}>
      {isProgressQuest ? (
        <div className="daily-progress-summary">
          <span>{t("daily.progressQuest")}</span>
          <strong>{t("daily.thisWeek")}: {formatAmount(weeklyProgress)} / {formatAmount(target)} {unit}</strong>
          <small>{t("daily.defaultToday")}: {formatAmount(contribution?.defaultContributionAmount ?? 0)} {unit}</small>
          {targetReached ? <em>{t("daily.weeklyTargetReached")}</em> : null}
        </div>
      ) : null}
      {isCompleted ? <p><strong>{t("daily.stepTaken")}</strong> {t("daily.stepTakenHelp")}</p> : null}
      {showContributionForm && !isCompleted ? (
        <form className="daily-contribution-complete" onSubmit={submitContribution}>
          <label>{t("daily.contributionPrompt")}<input type="number" min="0.01" step="0.01" value={contributionAmount} onChange={(event) => setContributionAmount(event.target.value)} required /></label>
          <div><button type="button" onClick={() => setShowContributionForm(false)} disabled={pending}>{t("common.cancel")}</button><button type="submit" disabled={pending}>{pending ? t("daily.updating") : t("daily.completeAndAddProgress")}</button></div>
        </form>
      ) : null}
      {!showContributionForm || isCompleted ? (
        <button type="button" onClick={updateCompletion} disabled={pending}>
          {pending ? t("daily.updating") : isCompleted ? t("daily.undoToday") : t("daily.completeToday")}
        </button>
      ) : null}
      {message ? <p className="daily-progress-message" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
    </div>
  );
}
