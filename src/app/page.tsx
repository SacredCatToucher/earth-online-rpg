import { BackupControls } from "@/components/settings/backup-controls";
import { CharacterSetup } from "@/components/character/character-setup";
import { DeveloperTools } from "@/components/settings/developer-tools";
import { FirstMinuteMapForm } from "@/components/first-minute/first-minute-map-form";
import { GameNav } from "@/components/navigation/game-nav";
import { T } from "@/components/i18n/language-provider";
import { LifeWorldsMap } from "@/components/map/life-worlds-map";
import { db } from "@/lib/db";
import { listWorldMap } from "@/server/queries/world-map";

export const dynamic = "force-dynamic";
const showDeveloperTools = process.env.NODE_ENV !== "production";
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function serializeLocation(location: Awaited<ReturnType<typeof listWorldMap>>["locations"][number]) {
  return {
    id: location.id,
    title: location.title,
    description: location.description,
    eventDate: location.eventDate.toISOString(),
    positionX: location.positionX,
    positionY: location.positionY,
    isMainQuestRoot: location.isMainQuestRoot,
    linkedLog: location.logs[0] ? {
      id: location.logs[0].id,
      title: location.logs[0].title,
      status: location.logs[0].status,
      parent: location.logs[0].parent ? {
        id: location.logs[0].parent.id,
        title: location.logs[0].parent.title,
        locationId: location.logs[0].parent.locationId,
      } : null,
    } : null,
  };
}

function textParam(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const [character, map] = await Promise.all([db.character.findFirst(), listWorldMap()]);
  const showFirstMinute = map.locations.length === 0;

  return (
    <main className="game-shell map-hub-shell">
      <header className="game-header map-hub-header">
        <div><p className="eyebrow"><T k="home.eyebrow" /></p><h1><T k="home.title" /></h1><p><T k="home.description" /></p></div>
        <BackupControls />
      </header>
      <GameNav active="map" />

      <section className="world-map-shell pixel-panel" aria-labelledby="world-map-title">
        <header className="world-map-heading"><div><p className="eyebrow"><T k="home.worldsEyebrow" /></p><h2 id="world-map-title"><T k="home.worldsTitle" /></h2></div><p><T k="home.worldsDescription" /></p></header>
        {showFirstMinute ? <FirstMinuteMapForm /> : <LifeWorldsMap initialWorldId={textParam(params.world)} worlds={map.worlds.map((world) => ({
          id: world.id,
          title: world.title,
          description: world.description,
          activeDirection: world.activeDirection,
          latestDiscovery: world.latestDiscovery ? { title: world.latestDiscovery.title, eventDate: world.latestDiscovery.eventDate.toISOString() } : null,
          locations: world.locations.map(serializeLocation),
          connections: world.connections,
        }))} />}
      </section>

      {showDeveloperTools ? <DeveloperTools /> : null}

      {!character && !showFirstMinute ? <CharacterSetup /> : null}
    </main>
  );
}
