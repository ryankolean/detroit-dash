// Authoritative replay scorer (v2.0, roguelite-aware v3.0). Given a day key + a
// tap-step timeline, re-runs the deterministic session and returns the exact
// score. Shared by the client (record/verify) and the Worker (score submissions
// without trusting the client). A tap is a jump, or a gate pick when a gate is
// open — the session decides, identically here and live.

import { seedFromDay } from './daily.js';
import { createSession } from './engine/session.js';

// Hard cap on a single run's length (steps). Bounds server work per submission.
export const MAX_STEPS = 100000;

/**
 * replayScore — deterministic authoritative score for a run.
 * @param {string} dayKey - "YYYYMMDD"
 * @param {number[]} tapSteps - ascending step indices at which the player tapped.
 * @returns {{ score:number, distance:number, coins:number, icons:number, steps:number }}
 */
export function replayScore(dayKey, tapSteps = []) {
  const session = createSession(seedFromDay(dayKey));
  const taps = new Set(tapSteps);

  let step = 0;
  while (step < MAX_STEPS) {
    const r = session.step(taps.has(step));
    if (!r.alive) break;
    step += 1;
  }

  return {
    score: session.score(),
    distance: Math.floor(session.world.meters),
    coins: session.scorer.coinsCollected,
    icons: session.scorer.iconsCollected,
    steps: step,
  };
}
