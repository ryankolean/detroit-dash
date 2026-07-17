// Authoritative replay scorer (v2.0, roguelite-aware v3.0, held-jump v3.6). Given
// a day key + an input-toggle timeline, re-runs the deterministic session and
// returns the exact score. Shared by the client (record/verify) and the Worker
// (score submissions without trusting the client).
//
// The timeline is a flat ascending list of the STEP indices where the jump button
// toggled (down, up, down, …). The button is held for a step when the number of
// toggles at-or-before it is odd — the same held-per-step values the live run fed
// the session, so a run and its replay always agree. A press (down edge) is a
// jump, or a gate pick when a gate is open — the session decides.

import { seedFromDay } from './daily.js';
import { createSession } from './engine/session.js';

// Hard cap on a single run's length (steps). Bounds server work per submission.
export const MAX_STEPS = 100000;

/**
 * replayScore — deterministic authoritative score for a run.
 * @param {string} dayKey - "YYYYMMDD"
 * @param {number[]} toggleSteps - ascending step indices where the button toggled.
 * @returns {{ score:number, distance:number, coins:number, icons:number, steps:number }}
 */
export function replayScore(dayKey, toggleSteps = []) {
  const session = createSession(seedFromDay(dayKey));

  let ti = 0;
  let held = false;
  let step = 0;
  while (step < MAX_STEPS) {
    // Apply every toggle landing on this step (flips held), then step with the
    // resulting level — matches how the live run sampled + recorded the button.
    while (ti < toggleSteps.length && toggleSteps[ti] === step) {
      held = !held;
      ti += 1;
    }
    const r = session.step(held);
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
