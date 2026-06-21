import { CreateDailyQuestForm } from "@/components/daily-quests/create-daily-quest-form";
import { DailyQuestCompletionButton } from "@/components/daily-quests/daily-quest-completion-button";
import { EditDailyQuestForm } from "@/components/daily-quests/edit-daily-quest-form";
import { GameNav } from "@/components/navigation/game-nav";
import { formatDailyQuestCadence } from "@/lib/daily-quest";
import { listDailyQuests } from "@/server/queries/daily-quest";

export const dynamic = "force-dynamic";

export default async function DailyQuestsPage() {
  const quests = await listDailyQuests();
  const todaysQuests = quests.filter((quest) => (quest.isActive && quest.isScheduledToday) || quest.isCompletedToday);

  return (
    <main className="game-shell daily-quest-shell">
      <header className="daily-quest-header"><div><p className="eyebrow">THE REPEATED PATH</p><h1>Daily Quests</h1><p>Shape recurring real-life actions into steady rituals for your longer adventure.</p></div></header>
      <GameNav active="daily" />
      <section className="daily-today-section" aria-labelledby="daily-today-heading">
        <div className="daily-section-heading"><div><p className="eyebrow">TODAY'S PATH</p><h2 id="daily-today-heading">Meaningful steps for today</h2></div><p>Each action is a small piece of the longer journey you are choosing.</p></div>
        <div className="daily-today-list">
          {todaysQuests.length ? todaysQuests.map((quest) => (
            <article className={`daily-today-card pixel-panel ${quest.isCompletedToday ? "completed" : ""}`} key={quest.id}>
              <h3>{quest.title}</h3>
              {quest.description ? <p>{quest.description}</p> : null}
              <DailyQuestCompletionButton id={quest.id} completed={quest.isCompletedToday} />
            </article>
          )) : <p className="daily-empty pixel-panel">No steps are set for today. The journey can have quiet days too.</p>}
        </div>
      </section>
      <CreateDailyQuestForm />
      <div className="daily-section-heading"><div><p className="eyebrow">PATH NOTES</p><h2>Daily Quest definitions</h2></div><p>Keep the recurring actions that belong in your current journey.</p></div>
      <section className="daily-quest-list" aria-label="Daily Quest definitions">
        {quests.length ? quests.map((quest) => (
          <article className={`daily-quest-card pixel-panel ${quest.isActive ? "active" : "paused"}`} key={quest.id}>
            <header><span className="daily-status">{quest.isActive ? "Active" : "Paused"}</span><h2>{quest.title}</h2></header>
            {quest.description ? <p>{quest.description}</p> : null}
            <div className="daily-cadence"><span>Repeat pattern</span><strong>{formatDailyQuestCadence(quest.daysOfWeek)}</strong></div>
            <EditDailyQuestForm quest={{ id: quest.id, title: quest.title, description: quest.description, daysOfWeek: quest.daysOfWeek, isActive: quest.isActive }} />
          </article>
        )) : <p className="daily-empty pixel-panel">No Daily Quests yet. Define the first ritual you want to carry forward.</p>}
      </section>
    </main>
  );
}
