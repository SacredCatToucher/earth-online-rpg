import { BackupControls } from "@/components/settings/backup-controls";
import { CharacterSetup } from "@/components/character/character-setup";
import { PixelPanel } from "@/components/pixel-ui/pixel-panel";
import { db } from "@/lib/db";
import { ensureFirstLaunchDefaults } from "@/server/services/bootstrap";
import { GameNav } from "@/components/navigation/game-nav";
import { WorldMap } from "@/components/map/world-map";
import { listWorldMap } from "@/server/queries/world-map";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureFirstLaunchDefaults();
  const [character, categories, skills, map] = await Promise.all([
    db.character.findFirst(),
    db.mainQuestCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    db.skill.findMany({ orderBy: { title: "asc" } }),
    listWorldMap(),
  ]);

  const requiredExp = (character?.level ?? 1) * 100;

  return (
    <main className="game-shell">
      <header className="game-header">
        <div>
          <p className="eyebrow">EARTH ONLINE</p>
          <h1>RPG LIFE</h1>
        </div>
        <BackupControls />
      </header>

      <GameNav active="map" />

      <div className="world-layout">
        <PixelPanel className="world-map" title="The Known World">
          <WorldMap connections={map.connections} locations={map.locations.map((location) => ({
            id: location.id,
            title: location.title,
            description: location.description,
            eventDate: location.eventDate.toISOString(),
            positionX: location.positionX,
            positionY: location.positionY,
            linkedLog: location.logs[0] ? {
              id: location.logs[0].id,
              title: location.logs[0].title,
              parent: location.logs[0].parent,
            } : null,
          }))} />
        </PixelPanel>

        <aside className="side-stack">
          <PixelPanel title="Character">
            <div className="character-row">
              <div className="avatar-placeholder" aria-hidden="true">?</div>
              <div><strong>{character?.name ?? "Unnamed Hero"}</strong><p>Level {character?.level ?? 1}</p></div>
            </div>
            <div className="exp-label"><span>EXP</span><span>{character?.currentExp ?? 0} / {requiredExp}</span></div>
            <div className="exp-bar"><span style={{ width: `${Math.min(100, ((character?.currentExp ?? 0) / requiredExp) * 100)}%` }} /></div>
          </PixelPanel>

          <PixelPanel title="Main Quests">
            <p className="empty-copy">No active quests yet.</p>
            <div className="category-chips">{categories.map((category) => <span key={category.id}>{category.title}</span>)}</div>
          </PixelPanel>

          <PixelPanel title="Skill Archives">
            <p className="empty-copy">Onboarding examples, fully yours to change.</p>
            <ul className="skill-list">{skills.map((skill) => <li key={skill.id}>{skill.title}<span>Lv {skill.level}</span></li>)}</ul>
          </PixelPanel>
        </aside>
      </div>

      {!character ? <CharacterSetup /> : null}
    </main>
  );
}
