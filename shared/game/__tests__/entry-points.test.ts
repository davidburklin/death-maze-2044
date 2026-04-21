import { describe, expect, it } from "vitest";
import {
  MAZE_ENTRY_POINT_COUNT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  generateEntryPoints
} from "../index";

const coordKey = (x: number, y: number): string => `${x},${y}`;

const isPerimeterCell = (x: number, y: number): boolean =>
  x === 0 || y === 0 || x === WORLD_WIDTH - 1 || y === WORLD_HEIGHT - 1;

describe("maze entry points", () => {
  it("generates five unique one-way entry targets by default", () => {
    const entryPoints = generateEntryPoints({ seed: 2044 });

    expect(entryPoints).toHaveLength(MAZE_ENTRY_POINT_COUNT);
    expect(new Set(entryPoints.map((entryPoint) => entryPoint.index)).size).toBe(MAZE_ENTRY_POINT_COUNT);
    expect(new Set(entryPoints.map((entryPoint) => coordKey(entryPoint.to.x, entryPoint.to.y))).size).toBe(MAZE_ENTRY_POINT_COUNT);
  });

  it("places all entry targets inside perimeter macro cells", () => {
    const entryPoints = generateEntryPoints({ seed: 512 });

    for (const entryPoint of entryPoints) {
      expect(entryPoint.to.x).toBeGreaterThanOrEqual(0);
      expect(entryPoint.to.y).toBeGreaterThanOrEqual(0);
      expect(entryPoint.to.x).toBeLessThan(WORLD_WIDTH);
      expect(entryPoint.to.y).toBeLessThan(WORLD_HEIGHT);
      expect(isPerimeterCell(entryPoint.to.x, entryPoint.to.y)).toBe(true);
    }
  });

  it("is deterministic for the same seed", () => {
    expect(generateEntryPoints({ seed: 99 })).toEqual(generateEntryPoints({ seed: 99 }));
  });
});
