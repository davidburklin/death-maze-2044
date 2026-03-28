import { describe, expect, it } from "vitest";
import {
  generateWorld,
  hasRunCompleted,
  type RunProgress,
  validateWorld,
  WORLD_HEIGHT,
  WORLD_WIDTH
} from "../index";

describe("world generation", () => {
  it("creates worlds matching core invariants", () => {
    const seedsToTest = 20;

    for (let seed = 1; seed <= seedsToTest; seed += 1) {
      const world = generateWorld({ seed });
      const issues = validateWorld(world);

      expect(world.width).toBe(WORLD_WIDTH);
      expect(world.height).toBe(WORLD_HEIGHT);
      expect(world.cells.length).toBe(WORLD_WIDTH * WORLD_HEIGHT);
      expect(issues).toEqual([]);
    }
  });

  it("randomizes run contracts across seeds", () => {
    const seen = new Set<string>();

    for (let seed = 1; seed <= 100; seed += 1) {
      seen.add(generateWorld({ seed }).nexusCore.contractMode);
    }

    expect(seen.has("override-only")).toBe(true);
    expect(seen.has("override-and-final-exit")).toBe(true);
  });

  it("requires final exit only for override-and-final-exit contracts", () => {
    const overrideOnly = generateWorld({ seed: 7, overrideOnlyChance: 1 });
    const overrideAndExit = generateWorld({ seed: 7, overrideOnlyChance: 0 });

    const baseProgress: RunProgress = {
      signalFragmentCount: 999,
      nexusCoreFound: true,
      atFinalExit: false
    };

    expect(hasRunCompleted(overrideOnly, baseProgress)).toBe(true);
    expect(hasRunCompleted(overrideAndExit, baseProgress)).toBe(false);
    expect(hasRunCompleted(overrideAndExit, { ...baseProgress, atFinalExit: true })).toBe(true);
  });
});
