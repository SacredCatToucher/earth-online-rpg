"use client";

import { useState } from "react";
import { useLanguage } from "@/components/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n";

type ToolAction = "clear" | "reset-demo";

const copy = {
  clear: {
    confirmation: "dev.clearConfirm",
    pending: "dev.clearPending",
    success: "dev.clearSuccess",
    error: "dev.clearError",
  },
  "reset-demo": {
    confirmation: "dev.resetConfirm",
    pending: "dev.resetPending",
    success: "dev.resetSuccess",
    error: "dev.resetError",
  },
} satisfies Record<ToolAction, { confirmation: TranslationKey; pending: TranslationKey; success: TranslationKey; error: TranslationKey }>;

async function readDeveloperToolResponse(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as { message?: string; error?: string };
  } catch {
    return {};
  }
}

export function DeveloperTools() {
  const { t } = useLanguage();
  const [status, setStatus] = useState("");
  const [pendingAction, setPendingAction] = useState<ToolAction | null>(null);

  async function runAction(action: ToolAction) {
    if (!window.confirm(t(copy[action].confirmation))) return;
    setPendingAction(action);
    setStatus(t(copy[action].pending));
    try {
      const response = await fetch("/api/developer-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await readDeveloperToolResponse(response);
      if (!response.ok) {
        setStatus(result.error && response.status === 403 ? result.error : t(copy[action].error));
        setPendingAction(null);
        return;
      }
      setStatus(`${t(copy[action].success)} ${t("dev.reloading")}`);
      setPendingAction(null);
      window.setTimeout(() => window.location.replace("/"), 50);
    } catch {
      setStatus(t(copy[action].error));
      setPendingAction(null);
    }
  }

  return (
    <section className="developer-tools pixel-panel" aria-labelledby="developer-tools-title">
      <div>
        <p className="eyebrow">{t("dev.title")}</p>
        <h2 id="developer-tools-title">{t("dev.localControls")}</h2>
        <p>{t("dev.subtitle")}</p>
      </div>
      <div className="danger-zone" aria-label={t("dev.danger")}>
        <div>
          <h3>{t("dev.danger")}</h3>
          <p>{t("dev.warning")}</p>
        </div>
        <article>
          <div>
            <strong>{t("dev.clear")}</strong>
            <p>{t("dev.clearDescription")}</p>
          </div>
          <button className="danger-button" type="button" onClick={() => runAction("clear")} disabled={pendingAction !== null}>
            {t("dev.clear")}
          </button>
        </article>
        <article>
          <div>
            <strong>{t("dev.reset")}</strong>
            <p>{t("dev.resetDescription")}</p>
          </div>
          <button className="text-button" type="button" onClick={() => runAction("reset-demo")} disabled={pendingAction !== null}>
            {t("dev.reset")}
          </button>
        </article>
        <span className="developer-tools-status" aria-live="polite">{status}</span>
      </div>
    </section>
  );
}
