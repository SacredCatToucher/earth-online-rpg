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
  isMainQuestRoot: boolean;
  linkedLog: {
    id: string;
    title: string;
    parent: { id: string; title: string; locationId: string | null } | null;
  } | null;
};

type WorldConnection = { sourceId: string; targetId: string; kind: "EVENT_TREE" | "CHRONOLOGICAL" };
type StagePosition = { x: number; y: number };

const stagesPerRow = 4;
const fallbackCanvasWidth = 900;
const stageColumns = [135, 345, 555, 765];

function stagePosition(index: number, stageCount: number): StagePosition {
  const row = Math.floor(index / stagesPerRow);
  const column = index % stagesPerRow;
  const rows = Math.max(1, Math.ceil(stageCount / stagesPerRow));
  const x = row % 2 === 0 ? stageColumns[column] : stageColumns[stagesPerRow - 1 - column];
  const y = rows === 1 ? 280 : 120 + row * 180;
  return { x, y };
}

function fallbackCanvasHeight(stageCount: number) {
  const rows = Math.max(1, Math.ceil(stageCount / stagesPerRow));
  return Math.max(560, 240 + (rows - 1) * 180);
}

function routePath(source: StagePosition, target: StagePosition) {
  const midpoint = (source.x + target.x) / 2;
  return `M ${source.x} ${source.y} C ${midpoint} ${source.y}, ${midpoint} ${target.y}, ${target.x} ${target.y}`;
}

function backbonePosition(index: number): StagePosition {
  return { x: 140 + index * 220, y: 140 };
}

function branchPositions(
  roots: WorldLocation[],
  connections: WorldConnection[],
  positionsById: Map<string, StagePosition>,
) {
  const childrenByParent = new Map<string, string[]>();
  for (const connection of connections.filter((item) => item.kind === "EVENT_TREE")) {
    const children = childrenByParent.get(connection.sourceId) ?? [];
    children.push(connection.targetId);
    childrenByParent.set(connection.sourceId, children);
  }

  function placeChildren(parentId: string, depth: number, visited: Set<string>) {
    const parent = positionsById.get(parentId);
    const children = childrenByParent.get(parentId) ?? [];
    if (!parent) return;
    children.forEach((childId, index) => {
      if (visited.has(childId)) return;
      visited.add(childId);
      const siblingOffset = (index - (children.length - 1) / 2) * 100;
      positionsById.set(childId, {
        x: Math.max(80, parent.x + siblingOffset + (depth % 2 === 0 ? 40 : 0)),
        y: 140 + depth * 140,
      });
      placeChildren(childId, depth + 1, visited);
    });
  }

  const visited = new Set(roots.map((root) => root.id));
  roots.forEach((root) => placeChildren(root.id, 1, visited));
  return visited;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "Asia/Taipei" }).format(new Date(value));
}

export function WorldMap({ locations, connections }: { locations: WorldLocation[]; connections: WorldConnection[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = locations.find((location) => location.id === selectedId) ?? null;
  const mainRoadLocations = locations.filter((location) => location.isMainQuestRoot);
  const hasMainRoad = mainRoadLocations.length > 0;
  const eventTreeConnections = connections.filter((connection) => connection.kind === "EVENT_TREE");
  const branchTargetIds = new Set(eventTreeConnections.map((connection) => connection.targetId));
  const fallbackBackboneLocations = hasMainRoad ? [] : locations.filter((location) => !branchTargetIds.has(location.id));
  const hasBranchAwareFallback = !hasMainRoad && eventTreeConnections.length > 0 && fallbackBackboneLocations.length > 0;
  const usesBranchLayout = hasMainRoad || hasBranchAwareFallback;
  const backboneLocations = hasMainRoad ? mainRoadLocations : fallbackBackboneLocations;
  const stageCount = locations.length ? locations.length + 1 : 1;
  const fallbackPositions = locations.map((_, index) => stagePosition(index, stageCount));
  const positionsById = new Map<string, StagePosition>();
  let branchLocationIds = new Set<string>();
  if (usesBranchLayout) {
    backboneLocations.forEach((location, index) => positionsById.set(location.id, backbonePosition(index)));
    const placedIds = branchPositions(backboneLocations, connections, positionsById);
    const backboneIds = new Set(backboneLocations.map((location) => location.id));
    branchLocationIds = new Set([...placedIds].filter((id) => !backboneIds.has(id)));
    const unplaced = locations.filter((location) => !placedIds.has(location.id));
    const branchBottom = Math.max(350, ...[...positionsById.values()].map((position) => position.y));
    unplaced.forEach((location, index) => positionsById.set(location.id, { x: 140 + index * 180, y: branchBottom + 150 }));
  } else {
    locations.forEach((location, index) => positionsById.set(location.id, fallbackPositions[index]));
  }
  const positions = locations.map((location) => positionsById.get(location.id)!);
  const lastBackbonePosition = usesBranchLayout ? positionsById.get(backboneLocations[backboneLocations.length - 1].id)! : null;
  const unchartedPosition = lastBackbonePosition ? { x: lastBackbonePosition.x + 170, y: lastBackbonePosition.y } : stagePosition(locations.length, stageCount);
  const mapWidth = usesBranchLayout
    ? Math.max(fallbackCanvasWidth, unchartedPosition.x + 140, ...positions.map((position) => position.x + 140))
    : fallbackCanvasWidth;
  const mapHeight = usesBranchLayout
    ? Math.max(560, ...positions.map((position) => position.y + 150))
    : fallbackCanvasHeight(stageCount);

  return (
    <>
      <div className="map-scroll-viewport journey-map-viewport">
        <div className="journey-map-board" style={{ width: `${mapWidth}px`, height: `${mapHeight}px`, minWidth: "100%", minHeight: "100%" }} aria-label="World Map of life milestones">
          <div className="terrain-region terrain-west" aria-hidden="true" />
          <div className="terrain-region terrain-east" aria-hidden="true" />
          <div className="terrain-region terrain-south" aria-hidden="true" />

          {locations.length ? (
            <svg className="journey-routes" style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }} viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true">
              {(usesBranchLayout ? connections.filter((connection) => connection.kind === "CHRONOLOGICAL") : positions.slice(1).map((_, index) => ({ sourceId: locations[index].id, targetId: locations[index + 1].id, kind: "CHRONOLOGICAL" as const }))).map((connection) => {
                const source = positionsById.get(connection.sourceId);
                const target = positionsById.get(connection.targetId);
                return source && target ? <path className="traveled-route main-road-route" d={routePath(source, target)} key={`road-${connection.sourceId}-${connection.targetId}`} /> : null;
              })}
              <path className="uncharted-route" d={routePath(lastBackbonePosition ?? positions[positions.length - 1], unchartedPosition)} />
              {eventTreeConnections.map((connection) => {
                const source = positionsById.get(connection.sourceId);
                const target = positionsById.get(connection.targetId);
                return source && target ? <path className="branch-route" d={routePath(source, target)} key={`${connection.sourceId}-${connection.targetId}`} /> : null;
              })}
            </svg>
          ) : null}

          {locations.map((location, index) => {
            const position = positions[index];
            const isFrontier = index === locations.length - 1;
            const isBranch = branchLocationIds.has(location.id);
            return (
              <button
                className={`journey-stage ${location.isMainQuestRoot ? "main-road-stage" : ""} ${isBranch ? "branch-stage" : ""} ${isFrontier ? "frontier" : "traveled"} ${selectedId === location.id ? "selected" : ""}`}
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
                type="button"
                key={location.id}
                onClick={() => setSelectedId(location.id)}
                aria-label={`Open ${isFrontier ? "latest discovered milestone" : "traveled milestone"}: ${location.title}`}
              >
                <span className="stage-marker"><span>{index + 1}</span></span>
                <strong>{location.title}</strong>
                {isBranch ? <small>{isFrontier ? "Related frontier" : "Related milestone"}</small> : isFrontier ? <small>Frontier</small> : null}
              </button>
            );
          })}

          {locations.length ? (
            <div className="journey-stage uncharted" style={{ left: `${unchartedPosition.x}px`, top: `${unchartedPosition.y}px` }} aria-hidden="true">
              <span className="stage-marker"><span>?</span></span><strong>Uncharted</strong><small>The road continues</small>
            </div>
          ) : (
            <div className="map-trailhead">
              <span aria-hidden="true">1</span><p className="eyebrow">YOUR TRAILHEAD</p><h3>The first place is waiting to be remembered</h3><p>Mark a meaningful Adventure Log entry as a World Map milestone, and your journey will begin here.</p><Link href="/adventure-log">Place your first milestone</Link>
            </div>
          )}
        </div>
      </div>

      <div className="map-legend" aria-label="Map legend"><span><i className="traveled" />{hasMainRoad ? "Main road" : hasBranchAwareFallback ? "Journey path" : "Traveled milestone"}</span>{usesBranchLayout ? <span><i className="branch" />Related milestone</span> : null}<span><i className="frontier" />Latest discovery</span><span><i className="uncharted" />Uncharted road</span></div>

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
