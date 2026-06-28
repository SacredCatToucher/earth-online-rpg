"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/i18n/language-provider";
import { profileFetch } from "@/lib/profiles";

export function DeleteEntryButton({ id }: { id: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function remove() {
    if (!window.confirm(t("journal.deleteConfirm"))) return;
    setPending(true);
    const response = await profileFetch(`/api/adventure-logs/${id}`, { method: "DELETE" });
    if (response.ok) router.refresh();
    else setPending(false);
  }
  return <button className="entry-action danger" type="button" onClick={remove} disabled={pending}>{pending ? t("journal.removing") : t("journal.remove")}</button>;
}
