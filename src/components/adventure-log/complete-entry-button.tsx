"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { localDateInputValue } from "@/lib/dates";

const phaseCompletedEvent = "rpg-life:phase-completed";

function phaseStatusLabel(status: string) {
  return status === "ONGOING" ? "Active Phase" : "Completed Phase";
}

export function PhaseStatusBadge({ id, initialStatus }: { id: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    function handleCompleted(event: Event) {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id === id) setStatus("COMPLETED");
    }
    window.addEventListener(phaseCompletedEvent, handleCompleted);
    return () => window.removeEventListener(phaseCompletedEvent, handleCompleted);
  }, [id]);

  return <span className={`event-status ${status.toLowerCase()}`}>{phaseStatusLabel(status)}</span>;
}

export function CompleteEntryButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [message]);

  async function complete() {
    setPending(true);
    setMessage("");
    setError("");
    const response = await fetch(`/api/adventure-logs/${id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedDate: localDateInputValue() }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (response.ok) {
      setCompleted(true);
      setMessage("Nice work - your journey just moved forward!");
      const card = document.getElementById(`entry-${id}`);
      card?.classList.remove("phase-ongoing");
      card?.classList.add("phase-completed");
      window.dispatchEvent(new CustomEvent(phaseCompletedEvent, { detail: { id } }));
      router.refresh();
    } else {
      setError(body.error ?? "Failed to complete phase. Please try again.");
    }
    setPending(false);
  }
  return (
    <span className="phase-complete-control">
      {!completed ? <button className="entry-action complete" type="button" onClick={complete} disabled={pending}>{pending ? "Completing..." : "Complete Phase"}</button> : null}
      {error ? <small className="phase-complete-error" role="alert">{error}</small> : null}
      {message ? <span className="phase-complete-toast" role="status">{message}</span> : null}
    </span>
  );
}
