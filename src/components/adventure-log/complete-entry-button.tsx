"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { localDateInputValue } from "@/lib/dates";

export function CompleteEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function complete() {
    if (!window.confirm("Mark this ongoing event as completed today?")) return;
    setPending(true);
    const response = await fetch(`/api/adventure-logs/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedDate: localDateInputValue() }),
    });
    if (response.ok) router.refresh();
    else setPending(false);
  }
  return <button className="entry-action complete" type="button" onClick={complete} disabled={pending}>{pending ? "Completing..." : "Complete"}</button>;
}
