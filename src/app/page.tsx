import { BackupControls } from "@/components/settings/backup-controls";
import { CharacterSetup } from "@/components/character/character-setup";
import { GameNav } from "@/components/navigation/game-nav";
import { LifeWorldsMap } from "@/components/map/life-worlds-map";
import { db } from "@/lib/db";
import { listWorldMap } from "@/server/queries/world-map";
import { ensureFirstLaunchDefaults } from "@/server/services/bootstrap";

export const dynamic = "force-dynamic";

function serializeLocation(location: Awaited<ReturnType<typeof listWorldMap>>["locations"][number]) {
  return {
    id: location.id,
    title: location.title,
    description: location.description,
    eventDate: location.eventDate.toISOString(),
    positionX: location.positionX,
    positionY: location.positionY,
    linkedLog: location.logs[0] ? {
      id: location.logs[0].id,
      title: location.logs[0].title,
      parent: location.logs[0].parent ? {
        id: location.logs[0].parent.id,
        title: location.logs[0].parent.title,
        locationId: location.logs[0].parent.locationId,
      } : null,
    } : null,
  };
}

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
        <header className="world-map-heading"><div><p className="eyebrow">YOUR LIFE WORLDS</p><h2 id="world-map-title">Where your journey is unfolding</h2></div><p>Each World holds a direction, the places you have reached, and the road still opening ahead.</p></header>
        <LifeWorldsMap worlds={map.worlds.map((world) => ({
          id: world.id,
          title: world.title,
          description: world.description,
          activeDirection: world.activeDirection,
          latestDiscovery: world.latestDiscovery ? { title: world.latestDiscovery.title, eventDate: world.latestDiscovery.eventDate.toISOString() } : null,
          locations: world.locations.map(serializeLocation),
          connections: world.connections,
        }))} />
      </section>

      {!character ? <CharacterSetup /> : null}
    </main>
  );
}
