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
type StagePosition = { x: number; y: number };

const stagesPerRow = 4;
const stageColumns = [15, 38.5, 61.5, 85];

function stagePosition(index: number, stageCount: number): StagePosition {
  const row = Math.floor(index / stagesPerRow);
  const column = index % stagesPerRow;
  const rows = Math.max(1, Math.ceil(stageCount / stagesPerRow));
  const x = row % 2 === 0 ? stageColumns[column] : stageColumns[stagesPerRow - 1 - column];
  const y = rows === 1 ? 50 : 12 + row * (76 / (rows - 1));
  return { x, y };
}

function routePath(source: StagePosition, target: StagePosition) {
  const midpoint = (source.x + target.x) / 2;
  return `M ${source.x} ${source.y} C ${midpoint} ${source.y}, ${midpoint} ${target.y}, ${target.x} ${target.y}`;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "Asia/Taipei" }).format(new Date(value));
}

export function WorldMap({ locations, connections }: { locations: WorldLocation[]; connections: WorldConnection[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = locations.find((location) => location.id === selectedId) ?? null;
  const stageCount = locations.length ? locations.length + 1 : 1;
  const positions = locations.map((_, index) => stagePosition(index, stageCount));
  const positionsById = new Map(locations.map((location, index) => [location.id, positions[index]]));
  const unchartedPosition = stagePosition(locations.length, stageCount);
  const rowCount = Math.max(1, Math.ceil(stageCount / stagesPerRow));

  return (
    <>
      <div className="journey-map-board" style={{ minHeight: `${Math.max(560, rowCount * 155)}px` }} aria-label="World Map of life milestones">
        <div className="terrain-region terrain-west" aria-hidden="true" />
        <div className="terrain-region terrain-east" aria-hidden="true" />
        <div className="terrain-region terrain-south" aria-hidden="true" />

        {locations.length ? (
          <svg className="journey-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {positions.slice(1).map((position, index) => <path className="traveled-route" d={routePath(positions[index], position)} key={`trail-${index}`} />)}
            <path className="uncharted-route" d={routePath(positions[positions.length - 1], unchartedPosition)} />
            {connections.filter((connection) => connection.kind === "EVENT_TREE").map((connection) => {
              const source = positionsById.get(connection.sourceId);
              const target = positionsById.get(connection.targetId);
              return source && target ? <path className="branch-route" d={routePath(source, target)} key={`${connection.sourceId}-${connection.targetId}`} /> : null;
            })}
          </svg>
        ) : null}

        {locations.map((location, index) => {
          const position = positions[index];
          const isFrontier = index === locations.length - 1;
          return (
            <button
              className={`journey-stage ${isFrontier ? "frontier" : "traveled"} ${selectedId === location.id ? "selected" : ""}`}
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
              type="button"
              key={location.id}
              onClick={() => setSelectedId(location.id)}
              aria-label={`Open ${isFrontier ? "latest discovered milestone" : "traveled milestone"}: ${location.title}`}
            >
              <span className="stage-marker"><span>{index + 1}</span></span>
              <strong>{location.title}</strong>
              {isFrontier ? <small>Frontier</small> : null}
            </button>
          );
        })}

        {locations.length ? (
          <div className="journey-stage uncharted" style={{ left: `${unchartedPosition.x}%`, top: `${unchartedPosition.y}%` }} aria-hidden="true">
            <span className="stage-marker"><span>?</span></span><strong>Uncharted</strong><small>The road continues</small>
          </div>
        ) : (
          <div className="map-trailhead">
            <span aria-hidden="true">1</span><p className="eyebrow">YOUR TRAILHEAD</p><h3>The first place is waiting to be remembered</h3><p>Mark a meaningful Adventure Log entry as a World Map milestone, and your journey will begin here.</p><Link href="/adventure-log">Place your first milestone</Link>
          </div>
        )}
      </div>

      <div className="map-legend" aria-label="Map legend"><span><i className="traveled" />Traveled milestone</span><span><i className="frontier" />Latest discovery</span><span><i className="uncharted" />Uncharted road</span></div>

      {selected ? (
        <aside className="map-story-panel" aria-live="polite">
          <button type="button" onClick={() => setSelectedId(null)} aria-label="Close location details">Close</button>
          <div><p className="eyebrow">MILESTONE {locations.findIndex((item) => item.id === selected.id) + 1}</p><time dateTime={selected.eventDate}>{displayDate(selected.eventDate)}</time><h3>{selected.title}</h3><p>{selected.description || "A meaningful place in your journey."}</p></div>
          <footer>
            {selected.linkedLog?.parent ? <div className="map-parent-context"><span>Continues from</span><Link href={`/adventure-log?search=${encodeURIComponent(selected.linkedLog.parent.title)}#entry-${selected.linkedLog.parent.id}`}>{selected.linkedLog.parent.title}</Link></div> : null}
            {selected.linkedLog ? <Link href={`/adventure-log?search=${encodeURIComponent(selected.linkedLog.title)}#entry-${selected.linkedLog.id}`}>Open linked Adventure Log entry</Link> : <span className="map-unlinked">No linked Adventure Log entry</span>}
          </footer>
        </aside>
      ) : <p className="map-hint">Choose a discovered stage to revisit the story held there.</p>}
    </>
  );
}
