import Link from "next/link";
import { T } from "@/components/i18n/language-provider";
import { ActivateMainQuestForm } from "@/components/main-quests/activate-main-quest-form";
import { CreateMainQuestForm } from "@/components/main-quests/create-main-quest-form";
import { CurrentCampaign } from "@/components/main-quests/current-campaign";
import { GameNav } from "@/components/navigation/game-nav";
import { db } from "@/lib/db";
import { listMainQuestOverview } from "@/server/queries/main-quest";
import { resolveCurrentProfileIdFromCookie } from "@/server/services/profiles";

export const dynamic = "force-dynamic";

type OverviewQuest = Awaited<ReturnType<typeof listMainQuestOverview>>["draftQuests"][number];

function displayDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Taipei" }).format(value) : null;
}

function rootLink(quest: OverviewQuest) {
  const root = quest.rootAdventureLog;
  return root ? `/adventure-log?search=${encodeURIComponent(root.title)}#entry-${root.id}` : "/adventure-log";
}

function SecondaryQuest({ quest }: { quest: OverviewQuest }) {
  const completedDate = displayDate(quest.completedDate);
  return (
    <article className={`secondary-quest-card ${quest.status.toLowerCase()}`}>
      <header><div><span>{quest.category.title}</span><span className={`quest-status-badge ${quest.status.toLowerCase()}`}>{quest.status === "COMPLETED" ? <T k="common.completed" /> : <T k="common.draft" />}</span></div><h3>{quest.title}</h3></header>
      {quest.description ? <p>{quest.description}</p> : null}
      <footer>
        <span>{completedDate ? `Completed ${completedDate}` : "Not yet begun"}</span>
        <Link href={rootLink(quest)}>View journey</Link>
      </footer>
      {quest.status === "DRAFT" ? <ActivateMainQuestForm id={quest.id} /> : null}
    </article>
  );
}

export default async function MainQuestsPage() {
  const profileId = await resolveCurrentProfileIdFromCookie();
  const [overview, categories] = await Promise.all([
    listMainQuestOverview(profileId),
    db.mainQuestCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] }),
  ]);

  return (
    <main className="game-shell main-quest-shell">
      <header className="main-quest-header"><div><p className="eyebrow"><T k="mainQuest.eyebrow" /></p><h1><T k="mainQuest.title" /></h1><p><T k="mainQuest.description" /></p></div></header>
      <GameNav active="quests" />

      <section className="campaign-section" aria-labelledby="campaign-title">
        <div className="quest-section-heading"><div><p className="eyebrow">WHERE YOU ARE HEADING</p><h2 id="campaign-title">{overview.activeCampaigns.length === 1 ? "Current Campaign" : "Current Campaigns"}</h2></div><p>These are the life directions you are actively choosing to move toward.</p></div>
        <div className="campaign-list">
          {overview.activeCampaigns.length ? overview.activeCampaigns.map((campaign) => <CurrentCampaign campaign={campaign} key={campaign.id} />) : (
            <div className="campaign-empty pixel-panel"><h3><T k="mainQuest.noCurrentCampaign" /></h3><p><T k="mainQuest.noActiveQuest" /></p></div>
          )}
        </div>
      </section>

      <details className="new-campaign-panel">
        <summary><span><strong><T k="mainQuest.chartNewRoad" /></strong><small><T k="mainQuest.chartNewRoadHelp" /></small></span></summary>
        <CreateMainQuestForm categories={categories.map(({ id, title }) => ({ id, title }))} />
      </details>

      <section className="secondary-quest-section" aria-labelledby="possible-roads-title">
        <div className="quest-section-heading"><div><p className="eyebrow">POSSIBLE ROADS</p><h2 id="possible-roads-title">Directions not yet begun</h2></div><p>Keep possibilities nearby without letting them compete with the journey underway.</p></div>
        <div className="secondary-quest-list">{overview.draftQuests.length ? overview.draftQuests.map((quest) => <SecondaryQuest quest={quest} key={quest.id} />) : <p className="secondary-quest-empty">No unstarted roads are waiting.</p>}</div>
      </section>

      <section className="secondary-quest-section traveled" aria-labelledby="roads-traveled-title">
        <div className="quest-section-heading"><div><p className="eyebrow">ROADS TRAVELED</p><h2 id="roads-traveled-title">Journeys already completed</h2></div><p>Return to the paths that show how far you have already come.</p></div>
        <div className="secondary-quest-list">{overview.completedQuests.length ? overview.completedQuests.map((quest) => <SecondaryQuest quest={quest} key={quest.id} />) : <p className="secondary-quest-empty">Completed journeys will gather here over time.</p>}</div>
      </section>
    </main>
  );
}
