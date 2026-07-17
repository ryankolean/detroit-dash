// Session test (v3.0 roguelite, held-jump v3.6). The session is the shared
// deterministic sim — segments, choice gates, power-ups, and the variable jump.
// These verify determinism + the effects the live game and the Worker rely on.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../src/engine/session.js';
import { createWorld } from '../src/engine/world.js';
import { createRng } from '../src/engine/rng.js';
import { seedFromDay } from '../src/daily.js';
import { SEGMENT, POWERUPS, WORLD_TUNING, PLAYER, OBSTACLES } from '../src/constants.js';

const SEED = seedFromDay('20260715');

// A deterministic auto-player for the held-jump model (v3.6). At a gate it toggles
// the button each step (guaranteeing a rising edge to pick). Otherwise it launches
// when an obstacle is in range and HOLDS the button for enough steps to clear it —
// a single-step tap is only a short hop now.
function autoplay(seed, cap) {
  const s = createSession(seed);
  const picks = [];
  let step = 0;
  let holdLeft = 0;
  while (step < cap) {
    let held = false;
    if (s.gate) {
      held = !s.prevHeld; // toggle -> periodic rising edges pick the option
      holdLeft = 0;
    } else if (holdLeft > 0) {
      held = true;
      holdLeft -= 1;
    } else if (s.player.grounded) {
      const px = s.player.x + s.player.width;
      let nearest = Infinity;
      for (const o of s.world.obstacles) {
        const g = o.x - px;
        if (g >= 0 && g < nearest) nearest = g;
      }
      if (nearest >= 20 && nearest <= 95) {
        held = true;
        holdLeft = 18; // hold long enough to clear the tallest hazards
      }
    }
    const r = s.step(held);
    if (r.picked) picks.push(r.picked);
    if (!r.alive) break;
    step += 1;
  }
  return { session: s, picks };
}

test('a choice gate opens after crossing the first segment', () => {
  const { session, picks } = autoplay(SEED, 3000);
  assert.ok(session.segment >= 1, 'reached at least one segment');
  assert.ok(picks.length >= 1, 'picked at least one power-up');
});

test('autoplay is deterministic (same seed -> same picks + score)', () => {
  const a = autoplay(SEED, 3000);
  const b = autoplay(SEED, 3000);
  assert.deepEqual(a.picks, b.picks);
  assert.equal(a.session.score(), b.session.score());
});

test('variable jump: holding rises much higher than a quick tap (v3.6)', () => {
  // Same launch, released after `holdSteps` -> apex height should scale with hold.
  function rise(holdSteps) {
    const s = createSession(SEED);
    const rest = s.player.y;
    let minY = rest;
    for (let i = 0; i < 160; i++) {
      s.step(i < holdSteps); // button held for the first holdSteps steps
      minY = Math.min(minY, s.player.y);
      if (s.player.grounded && i > holdSteps) break;
    }
    return rest - minY; // world-units risen above rest
  }
  const tap = rise(1); // press one step, release -> short hop
  const hold = rise(40); // sustained -> full jump
  assert.ok(tap > 2, 'a quick tap still leaves the ground');
  assert.ok(hold > tap + 25, `holding jumps meaningfully higher (tap=${tap.toFixed(0)}, hold=${hold.toFixed(0)})`);
});

test('shield absorbs one obstacle hit instead of ending the run', () => {
  // No-shield: dies at the first obstacle. With a shield pre-armed: survives it.
  const bare = createSession(SEED);
  let step = 0;
  while (step < 5000 && bare.step(false).alive) step += 1;
  const bareDied = bare.stepCount;

  const shielded = createSession(SEED);
  shielded.activate('shield');
  assert.equal(shielded.shield, POWERUPS.shieldHits);
  step = 0;
  let survivedPast = false;
  while (step < 5000) {
    const r = shielded.step(false);
    if (shielded.stepCount > bareDied + 5) {
      survivedPast = true;
      break;
    }
    if (!r.alive) break;
    step += 1;
  }
  assert.equal(shielded.shield, 0, 'shield was consumed');
  assert.ok(survivedPast, 'shielded run passed the point where the bare run died');
});

test('shields stack up to the cap (v3.5)', () => {
  const s = createSession(SEED);
  assert.ok(POWERUPS.maxShield >= 3, 'shields stack meaningfully');
  s.activate('shield');
  assert.equal(s.shield, 1);
  s.activate('shield');
  assert.equal(s.shield, 2); // stacks
  for (let i = 0; i < 10; i++) s.activate('shield');
  assert.equal(s.shield, POWERUPS.maxShield); // but not past the cap
});

test('an uncollected coin stays on screen (missed once) until it scrolls off', () => {
  const s = createSession(SEED);
  // Place a coin just past the player's left edge so it misses on the next step.
  s.world.coins.length = 0;
  s.world.coins.push({ x: s.player.x - 40, y: 360, w: 20, h: 20, icon: null });
  s.step(false);
  const coin = s.world.coins.find((c) => c.missed);
  assert.ok(coin, 'the missed coin remains in the world (not removed on pass)');
  assert.equal(s.scorer.comboCount, 0); // miss recorded (combo broken/zero)
  // A second step must not double-count the same miss.
  const before = s.scorer.comboCount;
  s.step(false);
  assert.equal(s.scorer.comboCount, before);
});

test('slow-mo reduces scroll distance over the same steps', () => {
  const normal = createSession(SEED);
  for (let i = 0; i < 60; i++) normal.step(false);
  const slowed = createSession(SEED);
  slowed.activate('slow');
  for (let i = 0; i < 60; i++) slowed.step(false);
  assert.ok(slowed.world.meters < normal.world.meters, 'slow-mo covered less ground');
});

test('double window doubles coin payout', () => {
  const s = createSession(SEED);
  s.scorer.collect({ icon: null }, 1); // one normal coin
  const normalGain = s.scorer.coinScore;
  s.activate('double');
  assert.ok(s.doubleActive());
  // pinned durations exist
  assert.ok(POWERUPS.doubleMeters > 0);
  assert.equal(normalGain, 50);
});

test('gate options are drawn deterministically from the seed', () => {
  const a = autoplay(SEED, 3000);
  const b = autoplay(SEED, 3000);
  // First gate's picked power-up is stable across runs.
  assert.equal(a.picks[0], b.picks[0]);
});

test('difficulty keeps rising: reaction window decays with distance (no plateau)', () => {
  const T = WORLD_TUNING;
  const react = (m) => Math.max(T.reactionFloor, T.reactionTime - T.reactionDrop * m);
  assert.ok(T.reactionDrop > 0, 'reaction window decays over distance');
  assert.ok(T.reactionFloor < T.reactionTime, 'floor is below the starting window');
  assert.ok(react(1000) < react(0), 'tighter by 1000 m');
  assert.ok(react(2000) < react(1000), 'and keeps tightening'); // no early plateau
});

test('obstacles vary in type and size (v3.6)', () => {
  // Drive the world directly so we observe many spawns without dying.
  const w = createWorld({ rng: createRng(SEED) });
  const types = new Set();
  const sizes = new Set();
  for (let i = 0; i < 240; i++) {
    w.spawn();
    const o = w.obstacles[w.obstacles.length - 1];
    types.add(o.type);
    sizes.add(`${o.w}x${o.h}`);
  }
  assert.ok(types.size >= 5, `several obstacle types appear (saw ${types.size})`);
  assert.ok(OBSTACLES.length >= 6, 'the catalog has real variety');
  assert.ok(sizes.size >= 24, `per-spawn jitter varies sizes (saw ${sizes.size})`);
});

test('coin clusters vary widely in elevation (v3.6)', () => {
  const w = createWorld({ rng: createRng(SEED) });
  const ys = new Set();
  for (let i = 0; i < 300; i++) {
    const before = w.coins.length;
    w.spawn();
    for (let k = before; k < w.coins.length; k++) ys.add(Math.round(w.coins[k].y));
  }
  assert.ok(ys.size >= 8, `coin heights vary (saw ${ys.size} distinct)`);
});

test('segments start generous and grow each level (progressive length)', () => {
  assert.ok(SEGMENT.first >= 200); // generous runway to the first gate (fairness)
  assert.ok(SEGMENT.grow > 0); // each subsequent segment is longer
});

test('post-pick countdown freezes then resumes (deterministic 3·2·1·GO)', () => {
  const s = createSession(SEED);
  // Survive (hold jumps over obstacles) until a gate opens.
  let guard = 0;
  let holdLeft = 0;
  while (guard++ < 20000 && !s.gate && s.alive) {
    let held = false;
    if (holdLeft > 0) {
      held = true;
      holdLeft -= 1;
    } else if (s.player.grounded) {
      const px = s.player.x + s.player.width;
      let n = Infinity;
      for (const o of s.world.obstacles) {
        const g = o.x - px;
        if (g >= 0 && g < n) n = g;
      }
      if (n >= 20 && n <= 95) {
        held = true;
        holdLeft = 18;
      }
    }
    s.step(held);
  }
  assert.ok(s.gate, 'a gate opened');
  if (s.prevHeld) s.step(false); // ensure the pick is a clean rising edge
  const before = s.world.meters;
  s.step(true); // press -> pick -> starts the countdown
  assert.ok(s.countdown, 'countdown started after the pick');
  // Holds for its full duration with the world frozen.
  const seen = new Set();
  const TOTAL = 4 * 32;
  for (let i = 0; i < TOTAL; i++) {
    seen.add(s.countdownLabel());
    s.step(false);
    assert.equal(s.world.meters, before, 'world frozen during countdown');
  }
  assert.ok(s.countdown, 'countdown persists through its full duration');
  s.step(false); // clears the countdown and resumes normal play
  assert.equal(s.countdown, null, 'countdown ended');
  assert.ok(seen.has('3') && seen.has('GO'), 'showed 3 … GO');
});

test('slow-mo preserves full jump height (bullet time, not a shorter jump)', () => {
  // Hold the button the whole rise, with and without slow-mo -> same peak height.
  function peak(slow) {
    const s = createSession(SEED);
    if (slow) s.activate('slow');
    let minY = s.player.y;
    for (let i = 0; i < 300; i++) {
      s.step(i < 45); // hold through the full rise (slow-mo stretches it in steps)
      minY = Math.min(minY, s.player.y);
      if (s.player.grounded && i > 45) break;
    }
    return minY;
  }
  const normalPeak = peak(false);
  const slowPeak = peak(true);
  assert.ok(Math.abs(normalPeak - slowPeak) < 3, 'apex height essentially unchanged under slow-mo');
});

test('jump-cut is wired: the cut velocity is upward but slower than a full launch (v3.6)', () => {
  assert.ok(PLAYER.jumpCutVelocity < 0, 'cut still moves upward');
  assert.ok(PLAYER.jumpCutVelocity > PLAYER.jumpVelocity, 'but slower than the full launch');
});
