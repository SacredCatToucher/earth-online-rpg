import { CreateDailyQuestForm } from "@/components/daily-quests/create-daily-quest-form";
import { DailyQuestCompletionButton } from "@/components/daily-quests/daily-quest-completion-button";
import { EditDailyQuestForm } from "@/components/daily-quests/edit-daily-quest-form";
import { T } from "@/components/i18n/language-provider";
import { GameNav } from "@/components/navigation/game-nav";
import { formatDailyQuestCadence } from "@/lib/daily-quest";
import { listDailyQuests } from "@/server/queries/daily-quest";

export const dynamic = "force-dynamic";

export default async function DailyQuestsPage() {
  const quests = await listDailyQuests();
  const todaysQuests = quests.filter((quest) => (quest.isActive && quest.isScheduledToday) || quest.isCompletedToday);
  const allTodayComplete = todaysQuests.length > 0 && todaysQuests.every((quest) => quest.isCompletedToday);
  const contributionFor = (quest: (typeof quests)[number]) => ({
    enabled: quest.contributionEnabled,
    weeklyTargetAmount: quest.weeklyTargetAmount,
    contributionUnit: quest.contributionUnit,
    defaultContributionAmount: quest.defaultContributionAmount,
    weeklyProgressAmount: quest.weeklyProgressAmount,
    todayContributionAmount: quest.todayContributionAmount,
  });

  return (
    <main className="game-shell daily-quest-shell">
      <header className="daily-quest-header"><div><p className="eyebrow"><T k="daily.eyebrow" /></p><h1><T k="daily.title" /></h1><p><T k="daily.description" /></p></div></header>
      <GameNav active="daily" />
      <section className="daily-today-section" aria-labelledby="daily-today-heading">
        <div className="daily-section-heading"><div><p className="eyebrow">TODAY'S PATH</p><h2 id="daily-today-heading">Meaningful steps for today</h2></div><p>Each action is a small piece of the longer journey you are choosing.</p></div>
        <div className="daily-today-list">
          {todaysQuests.length ? todaysQuests.map((quest) => (
            <article className={`daily-today-card pixel-panel ${quest.isCompletedToday ? "completed" : ""}`} key={quest.id}>
              <h3>{quest.title}</h3>
              {quest.description ? <p>{quest.description}</p> : null}
              <DailyQuestCompletionButton id={quest.id} completed={quest.isCompletedToday} contribution={contributionFor(quest)} />
            </article>
          )) : <p className="daily-empty pixel-panel">No steps are set for today. The journey can have quiet days too.</p>}
        </div>
        {allTodayComplete ? <p className="daily-clear-message pixel-panel"><T k="daily.todayClear" /></p> : null}
      </section>
      <CreateDailyQuestForm />
      <div className="daily-section-heading"><div><p className="eyebrow"><T k="daily.pathNotes" /></p><h2><T k="daily.definitions" /></h2></div><p><T k="daily.definitionsHelp" /></p></div>
      <section className="daily-quest-list" aria-label="Daily Quest definitions">
        {quests.length ? quests.map((quest) => (
          <article className={`daily-quest-card pixel-panel ${quest.isActive ? "active" : "paused"}`} key={quest.id}>
            <header><span className="daily-status">{quest.isActive ? "Active" : "Paused"}</span><h2>{quest.title}</h2></header>
            {quest.description ? <p>{quest.description}</p> : null}
            <div className="daily-cadence"><span>Repeat pattern</span><strong>{formatDailyQuestCadence(quest.daysOfWeek)}</strong></div>
            {quest.contributionEnabled ? (
              <div className="daily-definition-progress">
                <span><T k="daily.progressQuest" /></span>
                <strong><T k="daily.thisWeek" />: {quest.weeklyProgressAmount} / {quest.weeklyTargetAmount} {quest.contributionUnit}</strong>
                <small><T k="daily.defaultToday" />: {quest.defaultContributionAmount} {quest.contributionUnit}</small>
              </div>
            ) : null}
            <EditDailyQuestForm quest={{
              id: quest.id,
              title: quest.title,
              description: quest.description,
              daysOfWeek: quest.daysOfWeek,
              isActive: quest.isActive,
              contributionEnabled: quest.contributionEnabled,
              weeklyTargetAmount: quest.weeklyTargetAmount,
              contributionUnit: quest.contributionUnit,
              defaultContributionAmount: quest.defaultContributionAmount,
            }} />
          </article>
        )) : <p className="daily-empty pixel-panel"><T k="daily.empty" /></p>}
      </section>
    </main>
  );
}
