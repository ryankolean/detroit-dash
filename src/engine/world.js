// World — deterministic obstacle spawn + scroll from the seeded RNG (§3, §4).
// Pure simulation, no DOM. ALL randomness comes from the injected rng stream;
// no Math.random() here (§4). Same seed -> identical spawn list (§9 snapshot test).

import { WORLD, WORLD_TUNING, METERS_PER_UNIT, COIN, OBSTACLES, DT } from '../constants.js';
import { createPlayer } from './player.js';

// Weighted obstacle pool (v3.6) — each type repeated `weight` times so a uniform
// seeded pick lands on it proportionally. Built once at module load.
const OBSTACLE_POOL = [];
for (const o of OBSTACLES) for (let i = 0; i < o.weight; i++) OBSTACLE_POOL.push(o);

// Highest coin elevation still collectible by a full jump (v3.6.2). Measured from
// the REAL player physics so it tracks tuning: a coin is reachable iff the jump's
// apex box can overlap it, and the binding limit is apex HEIGHT (the generous
// full-sprite pickup box gives a wide horizontal window). A coin at elevation E has
// its bottom at groundY - E; reachable iff apexTopY < groundY - E, i.e.
// E < groundY - apexTopY. We keep COIN.reachMargin of clearance below that. Coin
// generation caps every elevation here, so nothing spawns above what a jump reaches.
function fullJumpApexTopY() {
  const p = createPlayer();
  p.jump();
  let minY = p.y;
  for (let i = 0; i < 240; i++) {
    p.update(DT, true); // hold the button -> full arc (no jump-cut)
    minY = Math.min(minY, p.y);
    if (p.grounded && i > 2) break;
  }
  return minY;
}
export const COIN_MAX_ELEV = Math.floor(WORLD.groundY - fullJumpApexTopY() - COIN.reachMargin);

/**
 * createWorld — build the world sim for a run. Deterministic given a seeded rng
 * stepped at a fixed dt (§4, §9).
 *
 * @param {Object} opts
 * @param {{ range:Function, int:Function, pick:Function }} opts.rng - seeded rng stream.
 * @returns {Object} world: { update(dt), obstacles, distance, meters, speed, ... }
 */
export function createWorld(opts) {
  const rng = opts.rng;
  const T = WORLD_TUNING;

  const w = {
    distance: 0, // total world-units scrolled
    meters: 0, // distance in meters (distance score = floor(meters))
    speed: T.baseSpeed,
    obstacles: [], // active { x, y, w, h }, x in screen space
    coins: [], // active collectibles { x, y, w, h } (v1.1)
    distToNextSpawn: T.gapFloor, // units of scroll until the next spawn

    spawn() {
      // Pick a hazard type from the weighted pool, then jitter its size so no two
      // spawns are identical (v3.6). All draws come from the seeded stream (§4).
      const def = rng.pick(OBSTACLE_POOL);
      const width = Math.max(10, def.w + rng.int(-def.jw, def.jw));
      const height = Math.max(10, def.h + rng.int(-def.jh, def.jh));
      w.obstacles.push({
        x: WORLD.width,
        y: WORLD.groundY - height,
        w: width,
        h: height,
        type: def.id, // renderer draws per-type art
      });
      // Fair gap that gets HARDER with distance (v3.5): the reaction window decays
      // from reactionTime toward reactionFloor as meters climb, so the gap shrinks
      // relative to speed — difficulty keeps rising instead of plateauing.
      const react = Math.max(T.reactionFloor, T.reactionTime - T.reactionDrop * w.meters);
      const reactionGap = Math.max(T.gapFloor, w.speed * react);
      w.distToNextSpawn = reactionGap + rng.range(0, T.gapVariety);

      // Coin cluster trailing the obstacle with high-variance BUT reachable layout
      // (v3.6.2): a seeded elevation tier (capped at COIN_MAX_ELEV so a full jump can
      // always reach it), spacing, lead offset, and flat-vs-arc shape. All drawn from
      // the stream so the collectible course is identical for everyone (§4).
      const coinCount = rng.int(0, COIN.maxPerCluster);
      const peak = Math.min(rng.pick(COIN.elevTiers), COIN_MAX_ELEV); // highest coin — reachable
      const gap = rng.int(COIN.clusterGapMin, COIN.clusterGapMax);
      const lead = rng.int(COIN.leadOffMin, COIN.leadOffMax);
      const arc = rng.next() < COIN.arcChance;
      const low = Math.max(0, peak - COIN.arcHeight); // arc ends drop toward the ground
      const span = Math.max(1, coinCount - 1);
      const before = w.coins.length;
      for (let i = 0; i < coinCount; i++) {
        // Flat row at `peak`, or an arc rising from `low` up to `peak` at the middle —
        // never above `peak`, so every coin stays within a full jump's reach.
        const elev = arc && coinCount > 1 ? low + (peak - low) * Math.sin((Math.PI * i) / span) : peak;
        w.coins.push({
          x: WORLD.width + lead + i * gap,
          y: WORLD.groundY - COIN.size - elev,
          w: COIN.size,
          h: COIN.size,
          icon: null,
        });
      }
      // Occasionally make the lead coin a Detroit-icon bonus token. One rng draw
      // gates it and picks the icon, so the collectible layout stays deterministic.
      const iconRoll = rng.next();
      if (coinCount > 0 && iconRoll < COIN.iconChance) {
        w.coins[before].icon = Math.floor((iconRoll / COIN.iconChance) * COIN.iconTypes);
      }
    },

    update(dt, speedMult = 1) {
      // Speed ramps with distance, capped. speedMult applies power-ups (slow-mo).
      w.speed = Math.min(T.maxSpeed, T.baseSpeed + T.speedRampPerMeter * w.meters);
      const step = w.speed * speedMult * dt;
      w.distance += step;
      w.meters = w.distance * METERS_PER_UNIT;

      // Scroll obstacles + coins left; retire off-screen obstacles. (Coins are
      // retired by resolveCoins when they pass the player; drop any stragglers.)
      for (const o of w.obstacles) o.x -= step;
      for (const c of w.coins) c.x -= step;
      w.obstacles = w.obstacles.filter((o) => o.x + o.w > 0);
      w.coins = w.coins.filter((c) => c.x + c.w > 0);

      // Spawn when enough scroll has elapsed.
      w.distToNextSpawn -= step;
      if (w.distToNextSpawn <= 0) w.spawn();
    },
  };
  return w;
}
