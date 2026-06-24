import Link from "next/link";
import { CompleteMainQuestButton } from "@/components/main-quests/complete-main-quest-button";
import { MainQuestProgressForm } from "@/components/main-quests/main-quest-progress-form";
import type { listMainQuestOverview } from "@/server/queries/main-quest";

type Campaign = Awaited<ReturnType<typeof listMainQuestOverview>>["activeCampaigns"][number];

function displayDate(value: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Taipei" }).format(value);
}

function adventureLogLink(campaign: Campaign) {
  const root = campaign.rootAdventureLog;
  return root ? `/adventure-log?search=${encodeURIComponent(root.title)}#entry-${root.id}` : "/adventure-log";
}

export function CurrentCampaign({ campaign }: { campaign: Campaign }) {
  const root = campaign.rootAdventureLog;
  const progress = Math.min(100, Math.max(0, (campaign.currentValue / Math.max(1, campaign.targetValue)) * 100));

  return (
    <article className="current-campaign pixel-panel">
      <header className="campaign-heading">
        <div><p className="eyebrow">CURRENT LIFE ARC</p><h3>{campaign.title}</h3></div>
        <div className="campaign-badges"><span className="quest-status-badge active">Active Quest</span><span>{campaign.category.title}</span></div>
      </header>
      {campaign.description ? <p className="campaign-purpose">{campaign.description}</p> : <p className="campaign-purpose muted">This road is still waiting for its reason to be written.</p>}

      <section className="campaign-journey" aria-label={`Journey context for ${campaign.title}`}>
        <div className="campaign-root">
          <span>Root journey</span>
          <strong>{root?.title ?? campaign.title}</strong>
          <small>{campaign.startDate ? `Began ${displayDate(campaign.startDate)}` : "The journey has not been dated."}</small>
          <Link href={adventureLogLink(campaign)}>Open this journey</Link>
        </div>
        <div className="campaign-chapters">
          <span>Recent journey notes</span>
          {root?.children.length ? (
            <ol>{root.children.map((entry) => (
              <li key={entry.id}>
                <div><strong>{entry.title}</strong><small>{displayDate(entry.startDate)} · {entry.status === "ONGOING" ? "Active Phase" : "Completed Phase"}</small></div>
                {entry.locationId ? <em>Milestone</em> : null}
              </li>
            ))}</ol>
          ) : <p>The road begins here. Open the root journey when the next meaningful chapter takes shape.</p>}
        </div>
      </section>

      <section className="campaign-progress" aria-label={`Progress controls for ${campaign.title}`}>
        <div className="quest-progress-label"><span>Journey measure</span><strong>{campaign.currentValue} / {campaign.targetValue} {campaign.unit}</strong></div>
        <div className="quest-progress"><span style={{ width: `${progress}%` }} /></div>
        <MainQuestProgressForm id={campaign.id} currentValue={campaign.currentValue} targetValue={campaign.targetValue} unit={campaign.unit} />
        <CompleteMainQuestButton id={campaign.id} />
      </section>
    </article>
  );
}
