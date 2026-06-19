import Link from "next/link";
import { GameNav } from "@/components/navigation/game-nav";
import { JournalEntryDialog } from "@/components/adventure-log/journal-entry-dialog";
import { JournalTree } from "@/components/adventure-log/journal-tree";
import { ADVENTURE_EVENT_TYPES } from "@/lib/constants";
import { EVENT_PRESENTATION } from "@/lib/adventure-log";
import { listAdventureLogParentOptions, listAdventureLogs } from "@/server/queries/adventure-log";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function textParam(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }
export default async function AdventureLogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = { search: textParam(params.search), type: textParam(params.type), from: textParam(params.from), to: textParam(params.to), page: Number(textParam(params.page)) || 1 };
  const hasFilters = Boolean(filters.search || filters.type || filters.from || filters.to);
  const [result, parentOptions] = await Promise.all([listAdventureLogs(filters), listAdventureLogParentOptions()]);
  const queryForPage = (page: number) => {
    const next = new URLSearchParams();
    if (filters.search) next.set("search", filters.search);
    if (filters.type) next.set("type", filters.type);
    if (filters.from) next.set("from", filters.from);
    if (filters.to) next.set("to", filters.to);
    next.set("page", String(page));
    return `/adventure-log?${next}`;
  };

  return (
    <main className="game-shell journal-shell">
      <header className="journal-header">
        <div><p className="eyebrow">CHRONICLE OF A LIFE</p><h1>Adventure Log</h1><p>Every quest leaves a story. Keep the parts you want your future self to find.</p></div>
        <JournalEntryDialog parentOptions={parentOptions} />
      </header>
      <GameNav active="journal" />

      <form className="journal-filters pixel-panel" method="get">
        <label>Search the chronicle<input name="search" defaultValue={filters.search} placeholder="A title or remembered detail..." /></label>
        <label>Event type<select name="type" defaultValue={filters.type}><option value="">All events</option>{ADVENTURE_EVENT_TYPES.map((type) => <option value={type} key={type}>{EVENT_PRESENTATION[type].label}</option>)}</select></label>
        <label>From<input name="from" type="date" defaultValue={filters.from} /></label>
        <label>To<input name="to" type="date" defaultValue={filters.to} /></label>
        <button className="text-button" type="submit">Search</button>
        <Link className="filter-clear" href="/adventure-log">Clear</Link>
      </form>

      <div className="chronicle-summary"><span>{result.totalMatches} matching {result.totalMatches === 1 ? "event" : "events"} across {result.totalBranches} quest {result.totalBranches === 1 ? "branch" : "branches"}</span><span>Branches newest first</span></div>
      {result.entries.length ? (
        <JournalTree entries={result.entries} parentOptions={parentOptions} />
      ) : (
        <section className="empty-chronicle pixel-panel"><span className="empty-book">J</span><h2>{hasFilters ? "No memories match these runes" : "Your chronicle awaits"}</h2><p>{hasFilters ? "Change the search or clear the filters." : "Write the first entry. Begin with a moment you never want to lose."}</p></section>
      )}
      {result.pageCount > 1 ? <nav className="journal-pagination" aria-label="Quest branch pages">{result.page > 1 ? <Link href={queryForPage(result.page - 1)}>Newer branches</Link> : <span /> }<span>Branch page {result.page} of {result.pageCount}</span>{result.page < result.pageCount ? <Link href={queryForPage(result.page + 1)}>Older branches</Link> : <span />}</nav> : null}
    </main>
  );
}
