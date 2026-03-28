import { WORLD_HEIGHT, WORLD_WIDTH, type MacroConnection, type RunProgress, type WorldGraph } from "./types";

const coordKey = (x: number, y: number): string => `${x},${y}`;

const buildAdjacency = (connections: MacroConnection[]): Map<string, string[]> => {
  const graph = new Map<string, string[]>();

  for (const edge of connections) {
    const from = coordKey(edge.from.x, edge.from.y);
    const to = coordKey(edge.to.x, edge.to.y);
    const list = graph.get(from) ?? [];
    list.push(to);
    graph.set(from, list);
  }

  return graph;
};

const hasDirectedPath = (graph: Map<string, string[]>, start: string, target: string): boolean => {
  const queue = [start];
  const visited = new Set<string>([start]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (current === target) {
      return true;
    }

    for (const next of graph.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return false;
};

export const validateWorld = (world: WorldGraph): string[] => {
  const issues: string[] = [];

  if (world.width !== WORLD_WIDTH || world.height !== WORLD_HEIGHT) {
    issues.push(`World must be ${WORLD_WIDTH}x${WORLD_HEIGHT}.`);
  }

  if (world.cells.length !== WORLD_WIDTH * WORLD_HEIGHT) {
    issues.push("Cell count does not match macro grid size.");
  }

  const inCount = new Map<string, number>();
  const outCount = new Map<string, number>();

  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      inCount.set(coordKey(x, y), 0);
      outCount.set(coordKey(x, y), 0);
    }
  }

  for (const cell of world.cells) {
    if (cell.roomCount < 2 || cell.roomCount > 5) {
      issues.push(`Cell ${cell.coord.x},${cell.coord.y} has invalid room count ${cell.roomCount}.`);
    }
  }

  for (const edge of world.connections) {
    const from = coordKey(edge.from.x, edge.from.y);
    const to = coordKey(edge.to.x, edge.to.y);
    outCount.set(from, (outCount.get(from) ?? 0) + 1);
    inCount.set(to, (inCount.get(to) ?? 0) + 1);
  }

  for (let y = 0; y < world.height; y += 1) {
    for (let x = 0; x < world.width; x += 1) {
      const key = coordKey(x, y);
      if ((inCount.get(key) ?? 0) < 1) {
        issues.push(`Cell ${key} has no inbound connections.`);
      }
      if ((outCount.get(key) ?? 0) < 1) {
        issues.push(`Cell ${key} has no outbound connections.`);
      }
    }
  }

  const graph = buildAdjacency(world.connections);
  const start = coordKey(world.objective.startCell.x, world.objective.startCell.y);
  const nexusCore = coordKey(world.objective.nexusCoreCell.x, world.objective.nexusCoreCell.y);
  const finalExit = coordKey(world.objective.finalExitCell.x, world.objective.finalExitCell.y);

  if (!hasDirectedPath(graph, start, nexusCore)) {
    issues.push("No directed path from start to nexus core cell.");
  }

  if (
    world.nexusCore.contractMode === "override-and-final-exit" &&
    !hasDirectedPath(graph, nexusCore, finalExit)
  ) {
    issues.push("Nexus-core-to-final-exit path missing for override-and-final-exit run contract.");
  }

  return issues;
};

export const hasRunCompleted = (world: WorldGraph, progress: RunProgress): boolean => {
  const coreOverridden = progress.nexusCoreFound && progress.signalFragmentCount >= world.nexusCore.signalFragmentsRequired;
  if (!coreOverridden) {
    return false;
  }

  if (world.nexusCore.contractMode === "override-only") {
    return true;
  }

  return progress.atFinalExit;
};
