"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/i18n/language-provider";
import { localDateInputValue } from "@/lib/dates";
import { profileFetch } from "@/lib/profiles";

type Attachment = { id: string; originalName: string; mimeType: string; sizeBytes: number };
type ParentOption = { id: string; title: string; parentId: string | null };
type InitialEntry = { id: string; title: string; description: string; startDate: string; endDate: string | null; status: string; parentId: string | null; isMilestone: boolean; attachments: Attachment[] };

export function JournalEntryDialog({ initial, parent, parentOptions = [] }: { initial?: InitialEntry; parent?: Pick<ParentOption, "id" | "title">; parentOptions?: ParentOption[] }) {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [attachments, setAttachments] = useState(initial?.attachments ?? []);
  const [startDate, setStartDate] = useState(initial?.startDate.slice(0, 10) ?? localDateInputValue());
  const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) ?? "");
  const [status, setStatus] = useState(initial?.status ?? "ONGOING");
  const [parentId, setParentId] = useState(initial?.parentId ?? parent?.id ?? "");
  const [isMilestone, setIsMilestone] = useState(initial?.isMilestone ?? false);
  const eligibleParents = useMemo(() => {
    if (!initial) return parentOptions;
    const excluded = new Set([initial.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const option of parentOptions) {
        if (option.parentId && excluded.has(option.parentId) && !excluded.has(option.id)) {
          excluded.add(option.id);
          changed = true;
        }
      }
    }
    return parentOptions.filter((option) => !excluded.has(option.id));
  }, [initial, parentOptions]);

  function open() {
    setError("");
    setStartDate(initial?.startDate.slice(0, 10) ?? localDateInputValue());
    setEndDate(initial?.endDate?.slice(0, 10) ?? "");
    setStatus(initial?.status ?? "ONGOING");
    setParentId(initial?.parentId ?? parent?.id ?? "");
    setIsMilestone(initial?.isMilestone ?? false);
    dialog.current?.showModal();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await profileFetch(initial ? `/api/adventure-logs/${initial.id}` : "/api/adventure-logs", {
      method: initial ? "PATCH" : "POST",
      body: new FormData(event.currentTarget),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? t("journal.saveError"));
      setPending(false);
      return;
    }
    setPending(false);
    dialog.current?.close();
    if (!initial) {
      form.current?.reset();
      setStartDate(localDateInputValue());
      setEndDate("");
      setStatus("ONGOING");
      setParentId(parent?.id ?? "");
      setIsMilestone(false);
    }
    router.refresh();
  }

  async function removeAttachment(attachmentId: string) {
    if (!initial || !window.confirm(t("journal.removeConfirm"))) return;
    const response = await profileFetch(`/api/adventure-logs/${initial.id}/attachments/${attachmentId}`, { method: "DELETE" });
    if (response.ok) setAttachments((current) => current.filter((item) => item.id !== attachmentId));
    else setError(t("journal.removeError"));
  }

  return (
    <>
      <button className={initial ? "entry-action" : "pixel-button journal-create"} type="button" onClick={open}>
        {initial ? t("journal.edit") : parent ? t("journal.addChild") : t("journal.create")}
      </button>
      <dialog className="journal-dialog" ref={dialog} onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}>
        <form className="journal-form pixel-panel" ref={form} onSubmit={submit}>
          <div className="form-heading">
            <div><p className="eyebrow">ADVENTURE RECORD</p><h2>{initial ? t("journal.revise") : parent ? `Continue: ${parent.title}` : t("journal.record")}</h2></div>
            <button className="dialog-close" type="button" onClick={() => dialog.current?.close()} aria-label={t("common.close")}>X</button>
          </div>
          <label htmlFor={`title-${initial?.id ?? "new"}`}>{t("journal.entryTitle")}</label>
          <input id={`title-${initial?.id ?? "new"}`} name="title" defaultValue={initial?.title} maxLength={120} required />
          <div className="journal-form-grid">
            <label htmlFor={`start-${initial?.id ?? "new"}`}>{t("journal.startDate")}<input id={`start-${initial?.id ?? "new"}`} name="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label>
            <label htmlFor={`status-${initial?.id ?? "new"}`}>{t("journal.status")}<select id={`status-${initial?.id ?? "new"}`} name="status" value={status} onChange={(event) => { setStatus(event.target.value); if (event.target.value === "ONGOING") setEndDate(""); }}><option value="ONGOING">{t("common.ongoing")}</option><option value="COMPLETED">{t("common.completed")}</option></select></label>
            <label htmlFor={`end-${initial?.id ?? "new"}`}>{t("journal.endDate")}<input id={`end-${initial?.id ?? "new"}`} name="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={status === "ONGOING"} /></label>
            <label htmlFor={`parent-${initial?.id ?? "new"}`}>{t("journal.parent")}<select id={`parent-${initial?.id ?? "new"}`} name="parentId" value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">{t("journal.noParent")}</option>{eligibleParents.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}</select></label>
          </div>
          <label htmlFor={`description-${initial?.id ?? "new"}`}>{t("journal.whatHappened")}</label>
          <textarea id={`description-${initial?.id ?? "new"}`} name="description" defaultValue={initial?.description} maxLength={20000} rows={9} placeholder={t("journal.descriptionPlaceholder")} />
          <label className="milestone-toggle"><input name="isMilestone" type="checkbox" value="true" checked={isMilestone} onChange={(event) => setIsMilestone(event.target.checked)} /><span><strong>{t("journal.placeOnMap")}</strong><small>{t("journal.placeOnMapHelp")}</small></span></label>
          {attachments.length ? <div className="existing-files"><strong>{t("journal.attached")}</strong>{attachments.map((attachment) => <div key={attachment.id}><span>{attachment.originalName}</span><button type="button" onClick={() => removeAttachment(attachment.id)}>{t("journal.remove")}</button></div>)}</div> : null}
          <label htmlFor={`files-${initial?.id ?? "new"}`}>{t("journal.files")}</label>
          <input id={`files-${initial?.id ?? "new"}`} name="attachments" type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/markdown,.doc,.docx,.odt" />
          <small className="field-help">{t("journal.fileHelp")}</small>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <div className="form-actions"><button className="text-button" type="button" onClick={() => dialog.current?.close()}>{t("common.cancel")}</button><button className="pixel-button" type="submit" disabled={pending}>{pending ? t("journal.saving") : t("journal.save")}</button></div>
        </form>
      </dialog>
    </>
  );
}
