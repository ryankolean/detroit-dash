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
import { dayKey, seedFromDay, puzzleNumber } from '../src/daily.js';
import { DT } from '../src/constants.js';

// Headless run: step the sim at fixed DT, fire jumps at the scripted step
// indices, stop on the first collision. Same as the real loop, minus rAF/DOM.
function headlessRun(seed, jumpSteps = []) {
  const rng = createRng(seed);
  const world = createWorld({ rng });
  const player = createPlayer();
  const jumps = new Set(jumpSteps);
  let step = 0;
  while (step < 100000) {
    if (jumps.has(step)) player.jump();
    world.update(DT);
    player.update(DT);
    if (playerHitsAny(player.hitbox(), world.obstacles)) break;
    step++;
  }
  return { score: Math.floor(world.meters), steps: step };
}

const DAY = '20260715';
const SEED = seedFromDay(DAY); // 313789980

test('keystone: no-input run dies at an exact pinned score', () => {
  const r = headlessRun(SEED);
  assert.equal(r.score, 90); // player never jumps -> first obstacle at 90 m
  assert.equal(r.steps, 180);
});

test('keystone: scripted jump timeline -> exact pinned score', () => {
  // A well-timed jump schedule (derived once, frozen). If world spawn, physics,
  // or collision drift, this exact score changes and the test fails.
  const jumpSteps = [158, 208, 254, 308, 363, 406, 443, 480, 517, 554];
  const r = headlessRun(SEED, jumpSteps);
  assert.equal(r.score, 374);
  assert.equal(r.steps, 554);
});

test('keystone: same seed + same inputs -> identical result (reproducible)', () => {
  const steps = [158, 208, 254, 308, 363, 406, 443, 480, 517, 554];
  assert.deepEqual(headlessRun(SEED, steps), headlessRun(SEED, steps));
});

test('keystone: different day seed -> different course', () => {
  // Same scripted inputs, different day: the courses diverge, so the outcome
  // differs. (A no-input run can't show this — it always dies at the fixed
  // first gap regardless of seed.)
  const steps = [158, 208, 254, 308, 363, 406, 443, 480, 517, 554];
  const a = headlessRun(seedFromDay('20260715'), steps);
  const b = headlessRun(seedFromDay('20260716'), steps);
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
