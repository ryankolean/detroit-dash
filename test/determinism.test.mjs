// KEYSTONE determinism test (§4, §9).
// Proves "same for everyone": a fixed seed + a scripted input timeline produces
// an exact, known final score. This is the most important test in the suite —
// the pinned constants ARE the "identical course for all players" guarantee.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replayScore } from '../src/replay.js';
import { dayKey, seedFromDay, puzzleNumber, isDaytime } from '../src/daily.js';

// The keystone now runs through the shared session (via replayScore) — the exact
// same code path the live game and the leaderboard Worker use. A tap is a jump
// (or a gate pick when a gate is open); the session decides. Pinned scores are
// the "identical course for everyone" guarantee (§4).
const DAY = '20260715';

// Short scripted tap timeline for DAY (derived once). Dies early — the point is
// determinism, not survival.
const TAP_TIMELINE = [180, 250, 320, 390];

test('keystone: no-input run dies at an exact pinned score', () => {
  const r = replayScore(DAY);
  assert.equal(r.distance, 89); // never jumps -> first obstacle
  assert.equal(r.coins, 0);
  assert.equal(r.score, 89);
  assert.equal(r.steps, 203);
});

test('keystone: scripted tap timeline -> exact pinned score', () => {
  // If world spawn, coin layout, physics, collision, or scoring drift, this exact
  // score changes and the test fails. The "same for everyone" pin.
  const r = replayScore(DAY, TAP_TIMELINE);
  assert.equal(r.distance, 178);
  assert.equal(r.coins, 2);
  assert.equal(r.score, 278);
  assert.equal(r.steps, 388);
});

test('keystone: same day + same inputs -> identical result (reproducible)', () => {
  assert.deepEqual(replayScore(DAY, TAP_TIMELINE), replayScore(DAY, TAP_TIMELINE));
});

test('keystone: different day -> different course', () => {
  const a = replayScore('20260715', TAP_TIMELINE);
  const b = replayScore('20260716', TAP_TIMELINE);
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

test('isDaytime: day vs night by Detroit local hour', () => {
  // EDT (UTC-4) in July. 17:00Z == 13:00 Detroit -> day.
  assert.equal(isDaytime(new Date('2026-07-15T17:00:00Z')), true);
  // 05:00Z == 01:00 Detroit -> night.
  assert.equal(isDaytime(new Date('2026-07-15T05:00:00Z')), false);
  // Boundaries: 07:00 Detroit is day, 19:00 Detroit is night.
  assert.equal(isDaytime(new Date('2026-07-15T11:00:00Z')), true); // 07:00 EDT
  assert.equal(isDaytime(new Date('2026-07-15T23:00:00Z')), false); // 19:00 EDT
});

test('puzzleNumber: launch day is #1; counts days since LAUNCH_EPOCH', () => {
  // LAUNCH_EPOCH is provisional 2026-07-20.
  assert.equal(puzzleNumber('20260720'), 1); // launch day
  assert.equal(puzzleNumber('20260721'), 2);
  assert.equal(puzzleNumber('20260801'), 13);
  assert.equal(puzzleNumber('20260715'), 1); // pre-launch clamps to #1
});
