"use client";

import Link from "next/link";
import { useState } from "react";

type WorldLocation = {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  positionX: number;
  positionY: number;
  linkedLog: {
    id: string;
    title: string;
    parent: { id: string; title: string; locationId: string | null } | null;
  } | null;
};

type WorldConnection = { sourceId: string; targetId: string; kind: "EVENT_TREE" | "CHRONOLOGICAL" };

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "Asia/Taipei" }).format(new Date(value));
}

export function WorldMap({ locations, connections }: { locations: WorldLocation[]; connections: WorldConnection[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = locations.find((location) => location.id === selectedId) ?? null;
  const locationsById = new Map(locations.map((location) => [location.id, location]));

  return (
    <>
      <div className="map-grid" aria-label="World Map of life milestones">
        {connections.length ? (
          <svg className="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {connections.map((connection) => {
              const source = locationsById.get(connection.sourceId);
              const target = locationsById.get(connection.targetId);
              return source && target ? <line className={connection.kind === "EVENT_TREE" ? "event-tree" : "chronological"} key={`${connection.sourceId}-${connection.targetId}`} x1={source.positionX} y1={source.positionY} x2={target.positionX} y2={target.positionY} /> : null;
            })}
          </svg>
        ) : null}
        {locations.map((location, index) => (
          <button
            className={`real-map-node ${selectedId === location.id ? "selected" : ""}`}
            style={{ left: `${location.positionX}%`, top: `${location.positionY}%` }}
            type="button"
            key={location.id}
            onClick={() => setSelectedId(location.id)}
            aria-label={`Open map location: ${location.title}`}
          >
            <span className="map-node-marker"><span>{index + 1}</span></span>
            <strong>{location.title}</strong>
          </button>
        ))}
        {!locations.length ? (
          <div className="map-empty-state"><span>?</span><strong>The world is waiting</strong><small>Mark a journal entry as a milestone to reveal your first location.</small></div>
        ) : null}
        {selected ? (
          <aside className="map-memory-card" aria-live="polite">
            <button type="button" onClick={() => setSelectedId(null)} aria-label="Close location details">X</button>
            <p className="eyebrow">MILESTONE {locations.findIndex((item) => item.id === selected.id) + 1}</p>
            <time dateTime={selected.eventDate}>{displayDate(selected.eventDate)}</time>
            <h3>{selected.title}</h3>
            <p>{selected.description || "A meaningful place in your journey."}</p>
            {selected.linkedLog?.parent ? <div className="map-parent-context"><span>Continues from</span><Link href={`/adventure-log?search=${encodeURIComponent(selected.linkedLog.parent.title)}#entry-${selected.linkedLog.parent.id}`}>{selected.linkedLog.parent.title}</Link></div> : null}
            {selected.linkedLog ? <Link href={`/adventure-log?search=${encodeURIComponent(selected.linkedLog.title)}#entry-${selected.linkedLog.id}`}>Open linked Adventure Log entry</Link> : <span className="map-unlinked">No linked journal entry</span>}
          </aside>
        ) : null}
      </div>
      <p className="map-hint">{locations.length ? "Select a location to revisit its story." : "Your meaningful memories will shape this world."}</p>
    </>
  );
}
