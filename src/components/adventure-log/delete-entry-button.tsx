"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function remove() {
    if (!window.confirm("Remove this entry from the visible timeline? Its memory will remain recoverable in local data.")) return;
    setPending(true);
    const response = await fetch(`/api/adventure-logs/${id}`, { method: "DELETE" });
    if (response.ok) router.refresh();
    else setPending(false);
  }
  return <button className="entry-action danger" type="button" onClick={remove} disabled={pending}>{pending ? "Removing..." : "Remove"}</button>;
}
