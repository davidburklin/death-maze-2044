import { createRng } from "../random";
import {
  MAZE_ENTRY_POINT_COUNT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type CellCoord,
  type MazeEntryPoint
} from "./types";

export interface GenerateEntryPointOptions {
  seed: number;
  count?: number;
}

const ENTRY_LABELS = [
  "North Intake",
  "East Intake",
  "South Intake",
  "West Intake",
  "Deep Intake"
];

function isPerimeterCell(coord: CellCoord): boolean {
  return coord.x === 0 || coord.y === 0 || coord.x === WORLD_WIDTH - 1 || coord.y === WORLD_HEIGHT - 1;
}

function createPerimeterCells(): CellCoord[] {
  const cells: CellCoord[] = [];

  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      const coord = { x, y };
      if (isPerimeterCell(coord)) {
        cells.push(coord);
      }
    }
  }

  return cells;
}

export function generateEntryPoints(options: GenerateEntryPointOptions): MazeEntryPoint[] {
  const count = options.count ?? MAZE_ENTRY_POINT_COUNT;
  const candidates = createPerimeterCells();

  if (!Number.isInteger(count) || count < 1 || count > candidates.length) {
    throw new Error(`Entry point count must be between 1 and ${candidates.length}.`);
  }

  const rng = createRng(options.seed ^ 0x5eed1eaf);
  const available = [...candidates];
  const entryPoints: MazeEntryPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    const selectedIndex = rng.int(0, available.length - 1);
    const [to] = available.splice(selectedIndex, 1);

    if (!to) {
      throw new Error("Failed to assign maze entry point.");
    }

    entryPoints.push({
      index,
      label: ENTRY_LABELS[index] ?? `Intake ${index + 1}`,
      to
    });
  }

  return entryPoints;
}

