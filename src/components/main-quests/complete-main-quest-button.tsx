"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";
import { localDateInputValue } from "@/lib/dates";
import { profileFetch } from "@/lib/profiles";

export function CompleteMainQuestButton({ id }: { id: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function complete() {
    if (!window.confirm(t("mainQuest.completeConfirm"))) return;
    setPending(true);
    setError("");
    const response = await profileFetch(`/api/main-quests/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedDate: localDateInputValue() }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? t("mainQuest.completeError"));
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="quest-complete-action">
      <button type="button" onClick={complete} disabled={pending}>{pending ? t("mainQuest.completing") : t("mainQuest.complete")}</button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
