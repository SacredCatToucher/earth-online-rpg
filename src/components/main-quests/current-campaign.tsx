import Link from "next/link";
import { T } from "@/components/i18n/language-provider";
import { CampaignStepSummary } from "@/components/main-quests/campaign-step-summary";
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
  const steps = root?.children ?? [];
  const progress = Math.min(100, Math.max(0, (campaign.currentValue / Math.max(1, campaign.targetValue)) * 100));

  return (
    <article className="current-campaign pixel-panel">
      <header className="campaign-heading">
        <div><p className="eyebrow"><T k="mainQuest.currentLifeArc" /></p><h3>{campaign.title}</h3></div>
        <div className="campaign-badges"><span className="quest-status-badge active"><T k="mainQuest.activeQuest" /></span><span>{campaign.category.title}</span></div>
      </header>
      {campaign.description ? <p className="campaign-purpose">{campaign.description}</p> : <p className="campaign-purpose muted"><T k="mainQuest.unwrittenReason" /></p>}

      <section className="campaign-journey" aria-label={`Journey context for ${campaign.title}`}>
        <div className="campaign-root">
          <span><T k="mainQuest.rootJourney" /></span>
          <strong>{root?.title ?? campaign.title}</strong>
          <small>{campaign.startDate ? <><T k="mainQuest.began" /> {displayDate(campaign.startDate)}</> : <T k="mainQuest.notDated" />}</small>
          <Link href={adventureLogLink(campaign)}><T k="mainQuest.openJourney" /></Link>
        </div>
        <CampaignStepSummary
          questId={campaign.id}
          initialSteps={steps.map((entry) => ({
            id: entry.id,
            title: entry.title,
            startDate: entry.startDate.toISOString(),
            status: entry.status,
            locationId: entry.locationId,
          }))}
        />
      </section>

      <section className="campaign-progress" aria-label={`Progress controls for ${campaign.title}`}>
        <div className="quest-progress-label"><span><T k="mainQuest.journeyMeasure" /></span><strong>{campaign.currentValue} / {campaign.targetValue} {campaign.unit}</strong></div>
        <div className="quest-progress"><span style={{ width: `${progress}%` }} /></div>
        <MainQuestProgressForm id={campaign.id} currentValue={campaign.currentValue} targetValue={campaign.targetValue} unit={campaign.unit} />
        <CompleteMainQuestButton id={campaign.id} />
      </section>
    </article>
  );
}
