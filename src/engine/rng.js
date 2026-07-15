// Seeded PRNG — mulberry32 (§4). Pure, deterministic, no DOM.
// This is the ONE source of randomness for all world generation. No Math.random()
// anywhere in the engine — same seed must always produce the same stream (§4, §9).

/**
 * mulberry32 — a fast, deterministic 32-bit seeded PRNG.
 * Returns a function that yields the next float in [0, 1) each call.
 *
 * @param {number} seed - 32-bit unsigned integer seed.
 * @returns {() => number} next() -> float in [0, 1)
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * createRng — a small deterministic stream API on top of mulberry32 (§4).
 * All world/player generation draws from this, never raw floats or Math.random().
 *
 * @param {number} seed - 32-bit unsigned integer seed.
 * @returns {{ next():number, range(min:number,max:number):number,
 *             int(min:number,max:number):number, pick(arr:any[]):any }}
 */
export function createRng(seed) {
  const next = mulberry32(seed);
  return {
    next, // float [0,1)
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => Math.floor(min + next() * (max - min + 1)), // inclusive both ends
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}
