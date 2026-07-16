// Deterministic run session (v3.0 roguelite). Owns the whole sim — world,
// player, scorer, choice gates, and power-ups — and advances it exactly one
// fixed step per call. Both the live loop (main.js) and the Worker replay
// (replay.js) drive this SAME code, so a run and its replay always agree — which
// is what keeps the leaderboard honest. Pure, DOM-free, no Math.random.

import { createRng } from './rng.js';
import { createWorld } from './world.js';
import { createPlayer } from './player.js';
import { aabbIntersects } from './collision.js';
import { createScorer } from './scoring.js';
import { DT, SEGMENT_METERS, GATE, POWERUPS, POWERUP_TYPES } from '../constants.js';

// Deterministic Fisher-Yates draw of `n` distinct power-ups from the seed stream.
function drawOptions(rng, n) {
  const pool = POWERUP_TYPES.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const t = pool[i];
    pool[i] = pool[j];
    pool[j] = t;
  }
  return pool.slice(0, n);
}

/**
 * createSession — build a run from a numeric seed (from seedFromDay).
 * @param {number} seed
 */
export function createSession(seed) {
  const rng = createRng(seed);
  const world = createWorld({ rng });
  const player = createPlayer();
  const scorer = createScorer();

  const s = {
    world,
    player,
    scorer,
    stepCount: 0,
    alive: true,
    segment: 0, // segments crossed (== gates opened)
    gate: null, // active choice gate: { options, highlight, startStep }
    shield: 0,
    // Power-up windows expire at a meters mark; -1 = inactive.
    magnetUntil: -1,
    slowUntil: -1,
    doubleUntil: -1,

    get meters() {
      return world.meters;
    },
    score() {
      return scorer.total(Math.floor(world.meters));
    },
    magnetActive() {
      return world.meters < s.magnetUntil;
    },
    slowActive() {
      return world.meters < s.slowUntil;
    },
    doubleActive() {
      return world.meters < s.doubleUntil;
    },

    activate(type) {
      if (type === 'shield') s.shield += POWERUPS.shieldHits;
      else if (type === 'magnet') s.magnetUntil = world.meters + POWERUPS.magnetMeters;
      else if (type === 'slow') s.slowUntil = world.meters + POWERUPS.slowMeters;
      else if (type === 'double') s.doubleUntil = world.meters + POWERUPS.doubleMeters;
    },

    /**
     * step — advance exactly one fixed DT step.
     * @param {boolean} tapped - did the player tap this step (jump, or gate pick)?
     * @returns {{ alive:boolean, jumped:boolean, picked:(string|null), collected:Array }}
     */
    step(tapped) {
      if (!s.alive) return { alive: false, jumped: false, picked: null, collected: [] };

      // --- Gate open: world is frozen (safe pick). Tap or timeout selects. ---
      if (s.gate) {
        const elapsed = s.stepCount - s.gate.startStep;
        s.gate.highlight = Math.floor(elapsed / GATE.cyclePeriodSteps) % s.gate.options.length;
        let picked = null;
        if (tapped || elapsed >= GATE.timeoutSteps) {
          picked = s.gate.options[s.gate.highlight];
          s.activate(picked);
          s.gate = null;
        }
        s.stepCount += 1;
        return { alive: true, jumped: false, picked, collected: [] };
      }

      // --- Normal step ---
      let jumped = false;
      if (tapped) {
        player.jump();
        jumped = true;
      }
      world.update(DT, s.slowActive() ? POWERUPS.slowFactor : 1);
      player.update(DT);

      // Coin collection (+ magnet pull, + 2x payout).
      const collected = [];
      const box = player.box();
      const magnet = s.magnetActive();
      const payout = s.doubleActive() ? POWERUPS.doubleFactor : 1;
      for (let i = world.coins.length - 1; i >= 0; i--) {
        const c = world.coins[i];
        const overlaps = aabbIntersects(box, c);
        const pulled = magnet && c.x <= player.x + POWERUPS.magnetRange && c.x + c.w > player.x;
        if (overlaps || pulled) {
          scorer.collect(c, payout);
          collected.push({ x: c.x + c.w / 2, y: c.y + c.h / 2, icon: c.icon ?? null });
          world.coins.splice(i, 1);
        } else if (c.x + c.w < player.x) {
          scorer.miss(); // passed uncollected -> combo breaks
          world.coins.splice(i, 1);
        }
      }

      // Open a choice gate each time a new segment is crossed.
      const seg = Math.floor(world.meters / SEGMENT_METERS);
      if (seg > s.segment) {
        s.segment = seg;
        s.gate = { options: drawOptions(rng, GATE.optionCount), highlight: 0, startStep: s.stepCount };
      }

      // Collision — shield absorbs one hit (and removes that obstacle).
      const hb = player.hitbox();
      const hitIndex = world.obstacles.findIndex((o) => aabbIntersects(hb, o));
      if (hitIndex >= 0) {
        if (s.shield > 0) {
          s.shield -= 1;
          world.obstacles.splice(hitIndex, 1);
        } else {
          s.alive = false;
        }
      }

      s.stepCount += 1;
      return { alive: s.alive, jumped, picked: null, collected };
    },
  };
  return s;
}
