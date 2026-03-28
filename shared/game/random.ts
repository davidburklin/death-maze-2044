export interface Rng {
  next: () => number;
  int: (min: number, max: number) => number;
  bool: (probability: number) => boolean;
  pick: <T>(values: T[]) => T;
}

export const createRng = (seed: number): Rng => {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min: number, max: number): number => {
      if (max < min) {
        throw new Error(`Invalid range: min ${min} > max ${max}`);
      }
      return Math.floor(next() * (max - min + 1)) + min;
    },
    bool: (probability: number): boolean => {
      if (probability < 0 || probability > 1) {
        throw new Error(`Probability must be in [0, 1], got ${probability}`);
      }
      return next() < probability;
    },
    pick: <T>(values: T[]): T => {
      if (values.length === 0) {
        throw new Error("Cannot pick from empty array");
      }
      return values[Math.floor(next() * values.length)]!;
    }
  };
};
