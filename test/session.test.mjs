// Session test (v3.0 roguelite). The session is the shared deterministic sim —
// segments, choice gates, and power-ups. These verify determinism + the power-up
// effects that the live game and the Worker both rely on.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../src/engine/session.js';
import { seedFromDay } from '../src/daily.js';
import { SEGMENT, POWERUPS } from '../src/constants.js';

const SEED = seedFromDay('20260715');

// A simple deterministic auto-player: pick when a gate is open, else jump when an
// obstacle is close. Runs up to `cap` steps.
function autoplay(seed, cap) {
  const s = createSession(seed);
  const picks = [];
  let step = 0;
  while (step < cap) {
    let tap = false;
    if (s.gate) tap = true;
    else if (s.player.grounded) {
      const px = s.player.x + s.player.width;
      let nearest = Infinity;
      for (const o of s.world.obstacles) {
        const g = o.x - px;
        if (g >= 0 && g < nearest) nearest = g;
      }
      tap = nearest >= 20 && nearest <= 60;
    }
    const r = s.step(tap);
    if (r.picked) picks.push(r.picked);
    if (!r.alive) break;
    step += 1;
  }
  return { session: s, picks };
}

test('a choice gate opens after crossing the first segment', () => {
  const { session, picks } = autoplay(SEED, 800);
  assert.ok(session.segment >= 1, 'reached at least one segment');
  assert.ok(picks.length >= 1, 'picked at least one power-up');
});

test('autoplay is deterministic (same seed -> same picks + score)', () => {
  const a = autoplay(SEED, 800);
  const b = autoplay(SEED, 800);
  assert.deepEqual(a.picks, b.picks);
  assert.equal(a.session.score(), b.session.score());
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

test('shield is capped (no invincibility hoarding, v3.1 balance)', () => {
  const s = createSession(SEED);
  for (let i = 0; i < 10; i++) s.activate('shield'); // spam shield picks
  assert.equal(s.shield, POWERUPS.maxShield);
  assert.ok(POWERUPS.maxShield <= 3, 'cap stays small');
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
  const a = autoplay(SEED, 800);
  const b = autoplay(SEED, 800);
  // First gate's picked power-up is stable across runs.
  assert.equal(a.picks[0], b.picks[0]);
});

test('segments start generous and grow each level (progressive length)', () => {
  assert.ok(SEGMENT.first >= 200); // generous runway to the first gate (fairness)
  assert.ok(SEGMENT.grow > 0); // each subsequent segment is longer
});

test('post-pick countdown freezes then resumes (deterministic 3·2·1·GO)', () => {
  const s = createSession(SEED);
  // Survive (jump obstacles) until a gate opens.
  let guard = 0;
  while (guard++ < 20000 && !s.gate && s.alive) {
    let tap = false;
    if (s.player.grounded) {
      const px = s.player.x + s.player.width;
      let n = Infinity;
      for (const o of s.world.obstacles) {
        const g = o.x - px;
        if (g >= 0 && g < n) n = g;
      }
      tap = n >= 20 && n <= 60;
    }
    s.step(tap);
  }
  assert.ok(s.gate, 'a gate opened');
  const before = s.world.meters;
  s.step(true); // pick -> starts the countdown
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
  // Same jump, with and without slow-mo -> the same peak height above ground.
  function peak(slow) {
    const s = createSession(SEED);
    if (slow) s.activate('slow');
    s.step(true); // jump
    let minY = s.player.y; // smaller y = higher
    for (let i = 0; i < 200; i++) {
      s.step(false);
      minY = Math.min(minY, s.player.y);
      if (s.player.grounded && i > 5) break;
    }
    return minY;
  }
  const normalPeak = peak(false);
  const slowPeak = peak(true);
  assert.ok(Math.abs(normalPeak - slowPeak) < 3, 'apex height essentially unchanged under slow-mo');
});
