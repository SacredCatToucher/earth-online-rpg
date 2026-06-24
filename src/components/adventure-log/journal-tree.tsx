import { JournalEntryDialog } from "@/components/adventure-log/journal-entry-dialog";
import { DeleteEntryButton } from "@/components/adventure-log/delete-entry-button";
import { CompleteEntryButton, PhaseStatusBadge } from "@/components/adventure-log/complete-entry-button";
import { EVENT_PRESENTATION, isAdventureEventType } from "@/lib/adventure-log";
import type { AdventureLogTreeNode } from "@/server/queries/adventure-log";

type ParentOption = { id: string; title: string; parentId: string | null };
function formatDate(date: Date) { return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "Asia/Taipei" }).format(date); }
function fileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }

function Entry({ entry, depth, parentOptions }: { entry: AdventureLogTreeNode; depth: number; parentOptions: ParentOption[] }) {
  const eventType = isAdventureEventType(entry.eventType) ? entry.eventType : "MANUAL_JOURNAL_ENTRY";
  const presentation = EVENT_PRESENTATION[eventType];
  const images = entry.attachments.filter((attachment) => attachment.mimeType.startsWith("image/"));
  const files = entry.attachments.filter((attachment) => !attachment.mimeType.startsWith("image/"));
  const initial = { id: entry.id, title: entry.title, description: entry.description, startDate: entry.startDate.toISOString(), endDate: entry.endDate?.toISOString() ?? null, status: entry.status, parentId: entry.parentId, isMilestone: Boolean(entry.locationId), attachments: entry.attachments };
  return (
    <li className={`timeline-entry quest-chain-entry tone-${presentation.tone}`} data-depth={depth}>
      <div className="timeline-sigil" aria-hidden="true">{presentation.sigil}</div>
      <article className={`journal-card pixel-panel phase-${entry.status.toLowerCase()}`} id={`entry-${entry.id}`}>
        <div className="entry-heading"><div><span className="event-ribbon">{presentation.label}</span><PhaseStatusBadge id={entry.id} initialStatus={entry.status} /><time dateTime={entry.startDate.toISOString()}>{formatDate(entry.startDate)}{entry.endDate ? ` - ${formatDate(entry.endDate)}` : ""}</time><h2>{entry.title}</h2></div>{entry.expEarned ? <strong className="entry-exp">+{entry.expEarned} EXP</strong> : null}</div>
        {entry.parent ? <p className={`chain-context ${entry.detachedFilterMatch ? "detached" : ""}`}>{entry.detachedFilterMatch ? "Shown independently because its parent is outside these filters: " : "Part of "}<a href={`#entry-${entry.parent.id}`}>{entry.parent.title}</a></p> : null}
        {entry.description ? <p className="entry-description">{entry.description}</p> : null}
        {images.length ? <div className={`memory-gallery count-${Math.min(images.length, 3)}`}>{images.map((image) => <a href={`/api/adventure-logs/${entry.id}/attachments/${image.id}`} target="_blank" rel="noreferrer" key={image.id}><img src={`/api/adventure-logs/${entry.id}/attachments/${image.id}`} alt={image.originalName} /></a>)}</div> : null}
        {files.length ? <div className="entry-files">{files.map((file) => <a href={`/api/adventure-logs/${entry.id}/attachments/${file.id}`} key={file.id}><span>{file.mimeType === "application/pdf" ? "PDF" : "FILE"}</span><span>{file.originalName}<small>{fileSize(file.sizeBytes)}</small></span></a>)}</div> : null}
        {entry.children.length ? <p className="child-count">{entry.children.length} linked {entry.children.length === 1 ? "event" : "events"}</p> : null}
        <footer className="entry-footer"><span>{entry.locationId ? "World Map milestone" : entry.origin === "SYSTEM" ? "Recorded by the world" : "Written by you"}</span><div><JournalEntryDialog parent={{ id: entry.id, title: entry.title }} parentOptions={parentOptions} />{entry.origin === "MANUAL" ? <><JournalEntryDialog initial={initial} parentOptions={parentOptions} />{entry.status === "ONGOING" ? <CompleteEntryButton id={entry.id} /> : null}<DeleteEntryButton id={entry.id} /></> : null}</div></footer>
      </article>
      {entry.children.length ? <ol className="timeline child-timeline">{entry.children.map((child) => <Entry key={child.id} entry={child} depth={depth + 1} parentOptions={parentOptions} />)}</ol> : null}
    </li>
  );
}

export function JournalTree({ entries, parentOptions }: { entries: AdventureLogTreeNode[]; parentOptions: ParentOption[] }) {
  return <ol className="timeline">{entries.map((entry) => <Entry key={entry.id} entry={entry} depth={0} parentOptions={parentOptions} />)}</ol>;
}
