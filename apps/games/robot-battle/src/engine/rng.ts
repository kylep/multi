/** Seedable RNG using mulberry32 algorithm. */

import type { Rng } from "./types";

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed?: number): Rng {
  const next = seed != null ? mulberry32(seed) : () => Math.random();
  return {
    random: next,
    choice<T>(arr: T[]): T {
      return arr[Math.floor(next() * arr.length)];
    },
  };
}
