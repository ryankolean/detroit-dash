// KEYSTONE determinism test (§4, §9) — SKELETON for the next session.
// Proves "same for everyone": a fixed seed + a scripted input timeline must
// produce an exact, known final score. This is the most important test in the
// suite. Implement alongside Phases 2–5 (see docs/IMPLEMENTATION_PLAN.md).

import { test } from 'node:test';
import assert from 'node:assert/strict';

// TODO(v1.0): also cover daily.js identity (Phase 2):
//   - dayKey(now) rolls over at America/Detroit local midnight (test around
//     midnight, and across a DST boundary, using injected Date values).
//   - seedFromDay(dayKey) is stable per day and well-distributed across days.
//   - puzzleNumber(dayKey) === daysSince(LAUNCH_EPOCH).

test('keystone: fixed seed + scripted inputs -> exact final score', () => {
  // TODO(v1.0): build a headless run — createWorld(seededRng) + createPlayer(),
  // step the sim at fixed dt, fire player.jump() at scripted step indices, stop
  // on collision, and assert the final floor(distance) equals a pinned constant.
  // Pin the expected score once the engine exists; that constant is the guarantee.
  assert.ok(true, 'TODO(v1.0): implement keystone determinism test');
});
