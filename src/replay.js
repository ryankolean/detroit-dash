// Authoritative replay scorer (v2.0). Given a day key + a jump-step timeline,
// re-runs the deterministic sim and returns the exact score. Shared by the client
// (to record/verify) and the Cloudflare Worker (to score submissions without
// trusting the client). Pure, DOM-free — the same modules the keystone test pins.

import { seedFromDay } from './daily.js';
import { createRng } from './engine/rng.js';
import { createWorld } from './engine/world.js';
import { createPlayer } from './engine/player.js';
import { playerHitsAny } from './engine/collision.js';
import { createScorer, resolveCoins } from './engine/scoring.js';
import { DT } from './constants.js';

// Hard cap on a single run's length (steps). Bounds server work per submission.
export const MAX_STEPS = 100000;

/**
 * replayScore — deterministic authoritative score for a run.
 * Mirrors the live loop order exactly: apply queued jump -> world -> player ->
 * coins -> collision, per fixed step. Same seed + same jumpSteps => same score
 * for everyone (§4).
 *
 * @param {string} dayKey - "YYYYMMDD"
 * @param {number[]} jumpSteps - ascending step indices at which the player jumped.
 * @returns {{ score:number, distance:number, coins:number, icons:number, steps:number }}
 */
export function replayScore(dayKey, jumpSteps = []) {
  const rng = createRng(seedFromDay(dayKey));
  const world = createWorld({ rng });
  const player = createPlayer();
  const scorer = createScorer();
  const jumps = new Set(jumpSteps);

  let step = 0;
  while (step < MAX_STEPS) {
    if (jumps.has(step)) player.jump();
    world.update(DT);
    player.update(DT);
    resolveCoins(world.coins, player.box(), scorer);
    if (playerHitsAny(player.hitbox(), world.obstacles)) break;
    step++;
  }

  return {
    score: scorer.total(Math.floor(world.meters)),
    distance: Math.floor(world.meters),
    coins: scorer.coinsCollected,
    icons: scorer.iconsCollected,
    steps: step,
  };
}
