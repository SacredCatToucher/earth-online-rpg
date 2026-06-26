"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";

export type CreatedNextStep = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  status: string;
  locationId: string | null;
};

export function AddNextStepForm({
  questId,
  hasSteps,
  onCreated,
}: {
  questId: string;
  hasSteps: boolean;
  onCreated?: (step: CreatedNextStep) => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canSubmit = title.trim().length > 0 && !pending;

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 5200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError(t("mainQuest.nextStepTitleRequired"));
      return;
    }

    setPending(true);
    setError("");
    setMessage("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/main-quests/${questId}/next-step`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(data.get("title") ?? ""),
        description: String(data.get("description") ?? ""),
      }),
    });
    const body = (await response.json().catch(() => ({}))) as Partial<CreatedNextStep>;
    if (!response.ok) {
      setError(t("mainQuest.nextStepError"));
      setPending(false);
      return;
    }

    if (body.id && body.title && body.startDate) {
      onCreated?.({
        id: body.id,
        title: body.title,
        description: body.description ?? "",
        startDate: body.startDate,
        status: body.status ?? "ONGOING",
        locationId: body.locationId ?? null,
      });
    }
    setPending(false);
    setOpen(false);
    setTitle("");
    form.current?.reset();
    setMessage(t("mainQuest.nextStepSuccess"));
    router.refresh();
  }

  return (
    <div className="next-step-control">
      {!open ? (
        <button className="text-button next-step-open" type="button" onClick={() => { setOpen(true); setError(""); }}>
          {hasSteps ? t("mainQuest.addNextStep") : t("mainQuest.addFirstStep")}
        </button>
      ) : (
        <form className="next-step-form" ref={form} onSubmit={submit}>
          <label htmlFor={`next-step-title-${questId}`}>
            {t("mainQuest.phaseTitle")}
            <input
              id={`next-step-title-${questId}`}
              name="title"
              maxLength={120}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (event.target.value.trim()) setError("");
              }}
              required
            />
          </label>
          <label htmlFor={`next-step-description-${questId}`}>
            {t("mainQuest.shortDescription")}
            <textarea id={`next-step-description-${questId}`} name="description" maxLength={20000} rows={3} />
          </label>
          {error ? <p className="next-step-error" role="alert">{error}</p> : null}
          <div className="next-step-actions">
            <button className="text-button" type="button" onClick={() => { setOpen(false); setError(""); }} disabled={pending}>
              {t("common.cancel")}
            </button>
            <button className="text-button primary" type="submit" disabled={!canSubmit}>
              {pending ? t("mainQuest.addingNextStep") : t("mainQuest.addNextStep")}
            </button>
          </div>
        </form>
      )}
      {message ? <p className="next-step-success" role="status">{message}</p> : null}
    </div>
  );
}
