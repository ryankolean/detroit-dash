// Replay scorer test (v2.0, roguelite-aware v3.0). replayScore is the Worker's
// authoritative scorer; it drives the same session as the live game, so it MUST
// agree with the determinism keystone.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replayScore } from '../src/replay.js';
import { seedFromDay } from '../src/daily.js';

const DAY = '20260715';
const TOGGLE_TIMELINE = [180, 250, 320, 390]; // held over [180,250) and [320,390)

test('replayScore: no input -> pinned 89 (matches keystone)', () => {
  const r = replayScore(DAY, []);
  assert.equal(r.distance, 89);
  assert.equal(r.score, 89);
  assert.equal(r.steps, 203);
});

test('replayScore: scripted toggle timeline -> pinned 318 (matches keystone)', () => {
  const r = replayScore(DAY, TOGGLE_TIMELINE);
  assert.equal(r.score, 318);
  assert.equal(r.distance, 118);
  assert.equal(r.coins, 1);
  assert.equal(r.steps, 265);
});

test('replayScore: reproducible for a given day + inputs', () => {
  assert.deepEqual(replayScore(DAY, TOGGLE_TIMELINE), replayScore(DAY, TOGGLE_TIMELINE));
});

test('replayScore: same inputs, different day -> different score', () => {
  assert.notEqual(replayScore('20260715', TOGGLE_TIMELINE).score, replayScore('20260716', TOGGLE_TIMELINE).score);
});

test('replayScore: seed is derived from the day key (server trusts only the day)', () => {
  assert.equal(seedFromDay(DAY), seedFromDay('20260715'));
});
