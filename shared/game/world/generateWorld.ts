import { createRng } from "../random";
import {
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type CellCoord,
  type MacroCell,
  type MacroConnection,
  type NexusCoreDefinition,
  type RunContractMode,
  type WorldGraph
} from "./types";

export interface GenerateWorldOptions {
  seed: number;
  gatedExitChance?: number;
  oneWayDoorChance?: number;
  overrideOnlyChance?: number;
}

const coordKey = (coord: CellCoord): string => `${coord.x},${coord.y}`;

const inBounds = (coord: CellCoord): boolean =>
  coord.x >= 0 && coord.y >= 0 && coord.x < WORLD_WIDTH && coord.y < WORLD_HEIGHT;

const neighbors = (coord: CellCoord): CellCoord[] =>
  [
    { x: coord.x, y: coord.y - 1 },
    { x: coord.x + 1, y: coord.y },
    { x: coord.x, y: coord.y + 1 },
    { x: coord.x - 1, y: coord.y }
  ].filter(inBounds);

const connectId = (from: CellCoord, to: CellCoord): string =>
  `${from.x},${from.y}->${to.x},${to.y}`;

const parseCoordKey = (value: string): CellCoord => {
  const [x, y] = value.split(",").map(Number);
  return { x, y };
};

const buildAdjacency = (connections: MacroConnection[]): Map<string, string[]> => {
  const graph = new Map<string, string[]>();

  for (const edge of connections) {
    const from = coordKey(edge.from);
    const to = coordKey(edge.to);
    const existing = graph.get(from) ?? [];
    existing.push(to);
    graph.set(from, existing);
  }

  return graph;
};

const reachableFrom = (graph: Map<string, string[]>, start: CellCoord): CellCoord[] => {
  const startKey = coordKey(start);
  const queue = [startKey];
  const visited = new Set<string>([startKey]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    for (const next of graph.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return [...visited].map(parseCoordKey);
};

const cellDistance = (a: CellCoord, b: CellCoord): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const pickFarthestReachable = (reachable: CellCoord[], from: CellCoord): CellCoord => {
  const sorted = [...reachable].sort((a, b) => {
    const distanceDiff = cellDistance(b, from) - cellDistance(a, from);
    if (distanceDiff !== 0) {
      return distanceDiff;
    }

    return a.y - b.y || a.x - b.x;
  });

  return sorted[0] ?? from;
};

const createCells = (seed: number, gatedExitChance: number): MacroCell[] => {
  const rng = createRng(seed ^ 0x9e3779b9);
  const cells: MacroCell[] = [];

  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      const gated = rng.bool(gatedExitChance);
      cells.push({
        coord: { x, y },
        roomCount: rng.int(2, 5),
        localExit: {
          isGated: gated,
          gateType: gated ? rng.pick(["networkLock", "sequenceGate", "credentialGate"]) : "none"
        }
      });
    }
  }

  return cells;
};

const buildBaseConnections = (seed: number): MacroConnection[] => {
  const rng = createRng(seed ^ 0xa341316c);
  const edges = new Map<string, MacroConnection>();

  const start: CellCoord = { x: 0, y: 0 };
  const visited = new Set<string>([coordKey(start)]);
  const frontier: CellCoord[] = [start];

  while (visited.size < WORLD_WIDTH * WORLD_HEIGHT) {
    const from = rng.pick(frontier);
    const unvisitedNeighbors = neighbors(from).filter((n) => !visited.has(coordKey(n)));

    if (unvisitedNeighbors.length === 0) {
      frontier.splice(frontier.findIndex((c) => c.x === from.x && c.y === from.y), 1);
      continue;
    }

    const to = rng.pick(unvisitedNeighbors);
    visited.add(coordKey(to));
    frontier.push(to);

    edges.set(connectId(from, to), {
      id: connectId(from, to),
      from,
      to,
      mode: "two-way",
      sealsOnPass: false
    });
    edges.set(connectId(to, from), {
      id: connectId(to, from),
      from: to,
      to: from,
      mode: "two-way",
      sealsOnPass: false
    });
  }

  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      const from = { x, y };
      for (const to of neighbors(from)) {
        if (rng.bool(0.12)) {
          edges.set(connectId(from, to), {
            id: connectId(from, to),
            from,
            to,
            mode: "two-way",
            sealsOnPass: false
          });
          edges.set(connectId(to, from), {
            id: connectId(to, from),
            from: to,
            to: from,
            mode: "two-way",
            sealsOnPass: false
          });
        }
      }
    }
  }

  return [...edges.values()];
};

const applyOneWayDoors = (seed: number, baseConnections: MacroConnection[], oneWayDoorChance: number): MacroConnection[] => {
  const rng = createRng(seed ^ 0xc8013ea4);
  const outgoing = new Map<string, number>();
  const incoming = new Map<string, number>();
  const pairMap = new Map<string, { forward?: MacroConnection; backward?: MacroConnection }>();

  for (const edge of baseConnections) {
    const fromKey = coordKey(edge.from);
    const toKey = coordKey(edge.to);
    outgoing.set(fromKey, (outgoing.get(fromKey) ?? 0) + 1);
    incoming.set(toKey, (incoming.get(toKey) ?? 0) + 1);

    const k1 = coordKey(edge.from);
    const k2 = coordKey(edge.to);
    const pairKey = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
    const pair = pairMap.get(pairKey) ?? {};

    if (`${edge.from.x},${edge.from.y}` < `${edge.to.x},${edge.to.y}`) {
      pair.forward = edge;
    } else {
      pair.backward = edge;
    }

    pairMap.set(pairKey, pair);
  }

  for (const [, pair] of pairMap) {
    if (!pair.forward || !pair.backward || !rng.bool(oneWayDoorChance)) {
      continue;
    }

    const keepForward = rng.bool(0.5);
    const kept = keepForward ? pair.forward : pair.backward;
    const removed = keepForward ? pair.backward : pair.forward;

    const removedFrom = coordKey(removed.from);
    const removedTo = coordKey(removed.to);

    if ((outgoing.get(removedFrom) ?? 0) <= 1 || (incoming.get(removedTo) ?? 0) <= 1) {
      continue;
    }

    outgoing.set(removedFrom, (outgoing.get(removedFrom) ?? 1) - 1);
    incoming.set(removedTo, (incoming.get(removedTo) ?? 1) - 1);

    kept.mode = "one-way";
    kept.sealsOnPass = true;

    pair.forward = kept;
    pair.backward = undefined;
  }

  const result: MacroConnection[] = [];
  for (const [, pair] of pairMap) {
    if (pair.forward) {
      result.push(pair.forward);
    }
    if (pair.backward) {
      result.push(pair.backward);
    }
  }

  return result;
};

const createNexusCore = (seed: number, overrideOnlyChance: number): NexusCoreDefinition => {
  const rng = createRng(seed ^ 0x6e624eb7);
  const contractMode: RunContractMode = rng.bool(overrideOnlyChance)
    ? "override-only"
    : "override-and-final-exit";

  const nexusCoreNames = [
    "Crimson Lattice",
    "Shard of Aethon",
    "Phantom Relay",
    "Obsidian Signal",
    "Veiled Conduit"
  ];

  return {
    nexusCoreId: `nexus-${seed}`,
    name: rng.pick(nexusCoreNames),
    signalFragmentsRequired: rng.int(2, 5),
    contractMode
  };
};

export const generateWorld = (options: GenerateWorldOptions): WorldGraph => {
  const gatedExitChance = options.gatedExitChance ?? 0.35;
  const oneWayDoorChance = options.oneWayDoorChance ?? 0.2;
  const overrideOnlyChance = options.overrideOnlyChance ?? 0.4;

  const cells = createCells(options.seed, gatedExitChance);
  const baseConnections = buildBaseConnections(options.seed);
  const connections = applyOneWayDoors(options.seed, baseConnections, oneWayDoorChance);
  const nexusCore = createNexusCore(options.seed, overrideOnlyChance);
  const graph = buildAdjacency(connections);
  const startCell: CellCoord = { x: 0, y: 0 };
  const startReachable = reachableFrom(graph, startCell);
  const nexusCoreCell = pickFarthestReachable(startReachable, startCell);

  let finalExitCell = { x: Math.floor(WORLD_WIDTH / 2), y: WORLD_HEIGHT - 1 };
  if (nexusCore.contractMode === "override-and-final-exit") {
    const coreReachable = reachableFrom(graph, nexusCoreCell);
    const nonCoreTargets = coreReachable.filter((cell) => coordKey(cell) !== coordKey(nexusCoreCell));
    finalExitCell = pickFarthestReachable(nonCoreTargets.length > 0 ? nonCoreTargets : coreReachable, nexusCoreCell);
  }

  return {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    seed: options.seed,
    cells,
    connections,
    nexusCore,
    objective: {
      startCell,
      nexusCoreCell,
      finalExitCell
    }
  };
};
