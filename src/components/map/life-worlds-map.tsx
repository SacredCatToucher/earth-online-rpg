"use client";

import Link from "next/link";
import { useState } from "react";
import { WorldMap } from "@/components/map/world-map";

type WorldLocation = {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  positionX: number;
  positionY: number;
  isMainQuestRoot: boolean;
  linkedLog: {
    id: string;
    title: string;
    status: string;
    parent: { id: string; title: string; locationId: string | null } | null;
  } | null;
};

type LifeWorld = {
  id: string;
  title: string;
  description: string;
  activeDirection: { id: string; title: string } | null;
  latestDiscovery: { title: string; eventDate: string } | null;
  locations: WorldLocation[];
  connections: WorldConnection[];
};

type WorldConnection = { sourceId: string; targetId: string; kind: "EVENT_TREE" | "CHRONOLOGICAL" };

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Taipei" }).format(new Date(value));
}

export function LifeWorldsMap({ worlds, initialWorldId }: { worlds: LifeWorld[]; initialWorldId?: string }) {
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(() => (
    initialWorldId && worlds.some((world) => world.id === initialWorldId) ? initialWorldId : null
  ));
  const selectedWorld = worlds.find((world) => world.id === selectedWorldId) ?? null;

  if (selectedWorld) {
    return (
      <section className="region-journey" aria-labelledby="region-journey-title">
        <header className="region-journey-heading">
          <button type="button" onClick={() => setSelectedWorldId(null)}>Back to Life Worlds</button>
          <div><p className="eyebrow">ENTERED WORLD</p><h3 id="region-journey-title">{selectedWorld.title}</h3><p>{selectedWorld.description}</p></div>
          {selectedWorld.activeDirection ? <aside><span>Current direction</span><strong>{selectedWorld.activeDirection.title}</strong></aside> : null}
        </header>
        <WorldMap key={selectedWorld.id} locations={selectedWorld.locations} connections={selectedWorld.connections} />
      </section>
    );
  }

  return (
    <section className="life-worlds-overview" aria-label="Life Worlds overview">
      <div className="map-scroll-viewport life-worlds-viewport">
        {worlds.length ? (
          <div className="life-worlds-board">
            {worlds.map((world, index) => (
              <button className={`life-world-region region-${index % 4}`} type="button" onClick={() => setSelectedWorldId(world.id)} key={world.id}>
                <span className="world-region-label">Life World</span>
                <strong>{world.title}</strong>
                <p>{world.description}</p>
                <div className="world-region-context">
                  {world.activeDirection ? <span><small>Current direction</small>{world.activeDirection.title}</span> : <span><small>Journey</small>This world is still taking shape</span>}
                  {world.latestDiscovery ? <span><small>Latest discovery</small>{world.latestDiscovery.title}<em>{displayDate(world.latestDiscovery.eventDate)}</em></span> : null}
                </div>
                <span className="enter-world">Enter world</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="life-worlds-empty"><span aria-hidden="true">?</span><p className="eyebrow">AN UNWRITTEN ATLAS</p><h3>Your life worlds are waiting to be discovered</h3><p>Begin with a meaningful direction or place one important memory on the map.</p><div><Link href="/main-quests">Choose a direction</Link><Link href="/adventure-log">Remember a milestone</Link></div></div>
        )}
      </div>
    </section>
  );
}
