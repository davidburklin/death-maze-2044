import { describe, expect, it } from "vitest";
import {
  createEntryConnectionId,
  findLegalMove,
  generateEntryPoints,
  generateWorld,
  getLegalMoves,
  isEntryPointReverseIntent,
  type MacroConnection,
  type WorldGraph
} from "../index";

const coordKey = (x: number, y: number): string => `${x},${y}`;

const pairKey = (connection: MacroConnection): string => {
  const from = coordKey(connection.from.x, connection.from.y);
  const to = coordKey(connection.to.x, connection.to.y);
  return from < to ? `${from}|${to}` : `${to}|${from}`;
};

const findWorldWithOneWayConnection = (): { world: WorldGraph; connection: MacroConnection } => {
  for (let seed = 1; seed <= 200; seed += 1) {
    const world = generateWorld({ seed, oneWayDoorChance: 1 });
    const connection = world.connections.find((candidate) => candidate.mode === "one-way");
    if (connection) {
      return { world, connection };
    }
  }

  throw new Error("Could not find a world with a one-way connection.");
};

const findTwoWayPair = (world: WorldGraph): { forward: MacroConnection; reverse: MacroConnection } => {
  const connectionsByPair = new Map<string, MacroConnection[]>();

  for (const connection of world.connections) {
    if (connection.mode !== "two-way") {
      continue;
    }

    const key = pairKey(connection);
    connectionsByPair.set(key, [...(connectionsByPair.get(key) ?? []), connection]);
  }

  for (const pair of connectionsByPair.values()) {
    const [forward, reverse] = pair;
    if (forward && reverse) {
      return { forward, reverse };
    }
  }

  throw new Error("Could not find a two-way connection pair.");
};

describe("movement legality", () => {
  it("lists legal exits from the current macro cell", () => {
    const world = generateWorld({ seed: 2044 });
    const from = world.objective.startCell;
    const legalMoves = getLegalMoves(world, from);

    expect(legalMoves.length).toBeGreaterThan(0);
    expect(legalMoves.every((move) => move.from.x === from.x && move.from.y === from.y)).toBe(true);
  });

  it("allows two-way passages from both represented directions", () => {
    const world = generateWorld({ seed: 17, oneWayDoorChance: 0 });
    const { forward, reverse } = findTwoWayPair(world);

    expect(findLegalMove(world, forward.from, forward.id)?.to).toEqual(forward.to);
    expect(findLegalMove(world, reverse.from, reverse.id)?.to).toEqual(reverse.to);
  });

  it("rejects reverse traversal through one-way macro-cell passages", () => {
    const { world, connection } = findWorldWithOneWayConnection();
    const reverseMove = getLegalMoves(world, connection.to)
      .find((move) => move.to.x === connection.from.x && move.to.y === connection.from.y);

    expect(findLegalMove(world, connection.from, connection.id)?.to).toEqual(connection.to);
    expect(reverseMove).toBeUndefined();
  });

  it("treats entry points as one-way entrances only", () => {
    const seed = 512;
    const world = generateWorld({ seed });
    const [entryPoint] = generateEntryPoints({ seed });

    if (!entryPoint) {
      throw new Error("Expected at least one entry point.");
    }

    const entryConnectionId = createEntryConnectionId(entryPoint.index);

    expect(isEntryPointReverseIntent([entryPoint], entryPoint.to, entryConnectionId)).toBe(true);
    expect(findLegalMove(world, entryPoint.to, entryConnectionId)).toBeNull();
  });
});

