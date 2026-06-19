import Link from "next/link";
import { CompleteMainQuestButton } from "@/components/main-quests/complete-main-quest-button";
import { CreateMainQuestForm } from "@/components/main-quests/create-main-quest-form";
import { MainQuestProgressForm } from "@/components/main-quests/main-quest-progress-form";
import { GameNav } from "@/components/navigation/game-nav";
import { db } from "@/lib/db";
import { ensureFirstLaunchDefaults } from "@/server/services/bootstrap";

export const dynamic = "force-dynamic";

function displayDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Taipei" }).format(value) : null;
}

export default async function MainQuestsPage() {
  await ensureFirstLaunchDefaults();
  const categories = await db.mainQuestCategory.findMany({
    include: {
      quests: {
        where: { deletedAt: null },
        include: { rootAdventureLog: true },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      },
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return (
    <main className="game-shell main-quest-shell">
      <header className="main-quest-header">
        <div><p className="eyebrow">THE LONG ROAD</p><h1>Main Quests</h1><p>Shape long-term goals into campaigns and trace every chapter through the Adventure Log.</p></div>
      </header>
      <GameNav active="quests" />

      <CreateMainQuestForm categories={categories.map(({ id, title }) => ({ id, title }))} />

      <div className="quest-category-grid">
        {categories.map((category) => (
          <section className="quest-category pixel-panel" key={category.id}>
            <header><h2>{category.title}</h2><span>{category.quests.length} {category.quests.length === 1 ? "quest" : "quests"}</span></header>
            {category.quests.length ? category.quests.map((quest) => {
              const progress = Math.min(100, Math.max(0, (quest.currentValue / Math.max(1, quest.targetValue)) * 100));
              const startDate = displayDate(quest.startDate);
              const completedDate = displayDate(quest.completedDate);
              return (
                <article className="main-quest-card" key={quest.id}>
                  <div className="main-quest-card-heading"><span className={`quest-status ${quest.status.toLowerCase()}`}>{quest.status}</span><h3>{quest.title}</h3></div>
                  {quest.description ? <p>{quest.description}</p> : null}
                  <div className="quest-progress-label"><span>Progress</span><strong>{quest.currentValue} / {quest.targetValue} {quest.unit}</strong></div>
                  <div className="quest-progress"><span style={{ width: `${progress}%` }} /></div>
                  {quest.status === "ACTIVE" ? <MainQuestProgressForm id={quest.id} currentValue={quest.currentValue} targetValue={quest.targetValue} unit={quest.unit} /> : null}
                  <footer>
                    <span>{completedDate ? `Completed ${completedDate}` : startDate ? `Started ${startDate}` : "Not started"}</span>
                    {quest.rootAdventureLog ? <Link href={`/adventure-log?search=${encodeURIComponent(quest.rootAdventureLog.title)}#entry-${quest.rootAdventureLog.id}`}>Open Adventure Log root</Link> : <span>Root unavailable</span>}
                  </footer>
                  {quest.status === "ACTIVE" ? <CompleteMainQuestButton id={quest.id} /> : null}
                </article>
              );
            }) : <p className="quest-category-empty">No quests in this category yet.</p>}
          </section>
        ))}
      </div>
    </main>
  );
}
