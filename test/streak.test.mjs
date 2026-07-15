// Streak logic test (§6, §9) — SKELETON for the next session.
// Verifies the localStorage streak transitions via crafted save states + an
// injected `now`. Implement alongside Phase 6 (see docs/IMPLEMENTATION_PLAN.md).

import { test } from 'node:test';
import assert from 'node:assert/strict';
// import { recordRun } from '../src/storage.js';

test('streak: consecutive day -> +1', () => {
  // TODO(v1.0): prev.lastPlayedDay === yesterday, recordRun(prev, {todayKey})
  //   -> currentStreak === prev.currentStreak + 1; maxStreak updated if exceeded.
  assert.ok(true, 'TODO(v1.0): implement consecutive-day streak test');
});

test('streak: gap (missed a day) -> reset to 1', () => {
  // TODO(v1.0): prev.lastPlayedDay is 2+ days ago -> currentStreak === 1.
  assert.ok(true, 'TODO(v1.0): implement gap-reset streak test');
});

test('streak: same day -> unchanged (one-shot lock)', () => {
  // TODO(v1.0): prev.lastPlayedDay === today -> streak unchanged; run not recorded
  //   twice; isLockedFor(state, today) === true.
  assert.ok(true, 'TODO(v1.0): implement same-day streak test');
});
