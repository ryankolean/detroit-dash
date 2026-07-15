// KEYSTONE determinism test (§4, §9).
// Proves "same for everyone": a fixed seed + a scripted input timeline produces
// an exact, known final score. This is the most important test in the suite —
// the pinned constants ARE the "identical course for all players" guarantee.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/engine/rng.js';
import { createWorld } from '../src/engine/world.js';
import { createPlayer } from '../src/engine/player.js';
import { playerHitsAny } from '../src/engine/collision.js';
import { createScorer, resolveCoins } from '../src/engine/scoring.js';
import { dayKey, seedFromDay, puzzleNumber } from '../src/daily.js';
import { DT } from '../src/constants.js';

// Headless run: step the sim at fixed DT, fire jumps at the scripted step
// indices, collect coins, stop on the first collision. Mirrors the real loop
// order exactly (world -> player -> coins -> collision), minus rAF/DOM. `score`
// is the v1.1 total (distance + combo coin score).
function headlessRun(seed, jumpSteps = []) {
  const rng = createRng(seed);
  const world = createWorld({ rng });
  const player = createPlayer();
  const scorer = createScorer();
  const jumps = new Set(jumpSteps);
  let step = 0;
  while (step < 100000) {
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
    steps: step,
  };
}

const DAY = '20260715';
const SEED = seedFromDay(DAY); // 313789980

// Frozen well-timed jump schedule for SEED (derived once). Collects 8 coins.
const JUMP_TIMELINE = [158, 208, 266, 312, 354, 403, 440, 477, 514];

test('keystone: no-input run dies at an exact pinned score', () => {
  const r = headlessRun(SEED);
  assert.equal(r.distance, 90); // never jumps -> first obstacle at 90 m
  assert.equal(r.coins, 0); // no coins reachable before that first hit
  assert.equal(r.score, 90);
  assert.equal(r.steps, 180);
});

test('keystone: scripted jump timeline -> exact pinned score (distance + combo)', () => {
  // If world spawn, coin layout, physics, collision, or combo math drift, this
  // exact score changes and the test fails. This is the "same for everyone" pin.
  const r = headlessRun(SEED, JUMP_TIMELINE);
  assert.equal(r.distance, 368);
  assert.equal(r.coins, 8);
  assert.equal(r.score, 818); // 368 distance + coin/combo score
  assert.equal(r.steps, 548);
});

test('keystone: same seed + same inputs -> identical result (reproducible)', () => {
  assert.deepEqual(headlessRun(SEED, JUMP_TIMELINE), headlessRun(SEED, JUMP_TIMELINE));
});

test('keystone: different day seed -> different course', () => {
  // Same scripted inputs, different day: the courses diverge, so the outcome
  // differs. (A no-input run can't show this — it always dies at the fixed
  // first gap regardless of seed.)
  const a = headlessRun(seedFromDay('20260715'), JUMP_TIMELINE);
  const b = headlessRun(seedFromDay('20260716'), JUMP_TIMELINE);
  assert.notEqual(a.score, b.score); // adjacent days are not the same puzzle
});

// --- daily.js identity (Phase 2, §4) --------------------------------------

test('dayKey: America/Detroit day rolls over at local midnight (EDT, UTC-4)', () => {
  // 2026-07-16 03:30 UTC == 2026-07-15 23:30 in Detroit (still the 15th).
  assert.equal(dayKey(new Date('2026-07-16T03:30:00Z')), '20260715');
  // 2026-07-16 04:30 UTC == 2026-07-16 00:30 in Detroit (now the 16th).
  assert.equal(dayKey(new Date('2026-07-16T04:30:00Z')), '20260716');
});

test('dayKey: honours the DST offset in winter (EST, UTC-5)', () => {
  // 2026-01-16 04:30 UTC == 2026-01-15 23:30 EST (still the 15th).
  assert.equal(dayKey(new Date('2026-01-16T04:30:00Z')), '20260115');
  // 2026-01-16 05:30 UTC == 2026-01-16 00:30 EST (now the 16th).
  assert.equal(dayKey(new Date('2026-01-16T05:30:00Z')), '20260116');
});

test('seedFromDay: stable per day, well-distributed across adjacent days', () => {
  assert.equal(seedFromDay('20260715'), seedFromDay('20260715')); // stable
  const a = seedFromDay('20260715');
  const b = seedFromDay('20260716');
  assert.notEqual(a, b);
  assert.ok(Math.abs(a - b) > 1000, 'adjacent seeds must not be near-identical');
  assert.ok(a >= 0 && a <= 0xffffffff, 'seed is a uint32');
});

test('puzzleNumber: launch day is #1; counts days since LAUNCH_EPOCH', () => {
  // LAUNCH_EPOCH is provisional 2026-07-20.
  assert.equal(puzzleNumber('20260720'), 1); // launch day
  assert.equal(puzzleNumber('20260721'), 2);
  assert.equal(puzzleNumber('20260801'), 13);
  assert.equal(puzzleNumber('20260715'), 1); // pre-launch clamps to #1
});
