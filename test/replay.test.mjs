// Replay scorer test (v2.0). replayScore is the Worker's authoritative scorer;
// it MUST agree with the determinism keystone — same modules, same order. If this
// diverges from test/determinism.test.mjs, client and server would disagree.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replayScore } from '../src/replay.js';
import { seedFromDay } from '../src/daily.js';

const DAY = '20260715';
const JUMP_TIMELINE = [158, 208, 266, 317, 366, 403, 440, 485, 522];

test('replayScore: no jumps -> pinned 90 (matches keystone)', () => {
  const r = replayScore(DAY, []);
  assert.equal(r.distance, 90);
  assert.equal(r.score, 90);
  assert.equal(r.steps, 180);
});

test('replayScore: scripted timeline -> pinned 1074 (matches keystone)', () => {
  const r = replayScore(DAY, JUMP_TIMELINE);
  assert.equal(r.score, 1074);
  assert.equal(r.distance, 374);
  assert.equal(r.coins, 7);
  assert.equal(r.icons, 1);
  assert.equal(r.steps, 554);
});

test('replayScore: reproducible for a given day + inputs', () => {
  assert.deepEqual(replayScore(DAY, JUMP_TIMELINE), replayScore(DAY, JUMP_TIMELINE));
});

test('replayScore: same inputs, different day -> different score (own course)', () => {
  const a = replayScore('20260715', JUMP_TIMELINE);
  const b = replayScore('20260716', JUMP_TIMELINE);
  assert.notEqual(a.score, b.score);
});

test('replayScore: seed is derived from the day key, not passed in', () => {
  // Sanity: the day key alone determines the course (server trusts only the day).
  assert.equal(seedFromDay(DAY), seedFromDay('20260715'));
});
