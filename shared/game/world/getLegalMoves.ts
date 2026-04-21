import type { CellCoord, Direction, DoorMode, MacroConnection, MazeEntryPoint, WorldGraph } from "./types";

export interface LegalMove {
  connectionId: string;
  from: CellCoord;
  to: CellCoord;
  direction: Direction;
  mode: DoorMode;
}

const coordEquals = (left: CellCoord, right: CellCoord): boolean =>
  left.x === right.x && left.y === right.y;

const directionBetween = (from: CellCoord, to: CellCoord): Direction => {
  if (to.x === from.x && to.y === from.y - 1) return "north";
  if (to.x === from.x + 1 && to.y === from.y) return "east";
  if (to.x === from.x && to.y === from.y + 1) return "south";
  if (to.x === from.x - 1 && to.y === from.y) return "west";

  throw new Error(`Connection ${from.x},${from.y}->${to.x},${to.y} is not cardinal.`);
};

const toLegalMove = (connection: MacroConnection): LegalMove => ({
  connectionId: connection.id,
  from: connection.from,
  to: connection.to,
  direction: directionBetween(connection.from, connection.to),
  mode: connection.mode
});

export const createEntryConnectionId = (entryIndex: number): string => `entry:${entryIndex}`;

export const getLegalMoves = (world: WorldGraph, from: CellCoord): LegalMove[] =>
  world.connections
    .filter((connection) => coordEquals(connection.from, from))
    .map(toLegalMove)
    .sort((left, right) => left.direction.localeCompare(right.direction));

export const findLegalMove = (
  world: WorldGraph,
  from: CellCoord,
  connectionId: string
): LegalMove | null => {
  const connection = world.connections.find((candidate) =>
    candidate.id === connectionId && coordEquals(candidate.from, from)
  );

  return connection ? toLegalMove(connection) : null;
};

export const isEntryPointReverseIntent = (
  entryPoints: MazeEntryPoint[],
  from: CellCoord,
  connectionId: string
): boolean =>
  entryPoints.some((entryPoint) =>
    createEntryConnectionId(entryPoint.index) === connectionId && coordEquals(entryPoint.to, from)
  );

