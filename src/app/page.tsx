import { BackupControls } from "@/components/settings/backup-controls";
import { CharacterSetup } from "@/components/character/character-setup";
import { GameNav } from "@/components/navigation/game-nav";
import { WorldMap } from "@/components/map/world-map";
import { db } from "@/lib/db";
import { listWorldMap } from "@/server/queries/world-map";
import { ensureFirstLaunchDefaults } from "@/server/services/bootstrap";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureFirstLaunchDefaults();
  const [character, map] = await Promise.all([db.character.findFirst(), listWorldMap()]);

  return (
    <main className="game-shell map-hub-shell">
      <header className="game-header map-hub-header">
        <div><p className="eyebrow">EARTH ONLINE</p><h1>Life Journey Map</h1><p>Every meaningful milestone reveals another part of the road you have traveled.</p></div>
        <BackupControls />
      </header>
      <GameNav active="map" />

      <section className="world-map-shell pixel-panel" aria-labelledby="world-map-title">
        <header className="world-map-heading"><div><p className="eyebrow">THE DISCOVERED WORLD</p><h2 id="world-map-title">Your adventure so far</h2></div><p>Follow the trail from the first remembered place to the edge of what comes next.</p></header>
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
      </section>

      {!character ? <CharacterSetup /> : null}
    </main>
  );
}
