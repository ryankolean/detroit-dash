// Stats aggregation test (v1.3). computeStats is pure over a save state. Run: npm test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStats } from '../src/storage.js';

function stateWith(overrides = {}) {
  return {
    lastPlayedDay: null,
    currentStreak: 0,
    maxStreak: 0,
    bestScore: 0,
    history: [],
    ...overrides,
  };
}

test('computeStats: zero-state -> empty aggregates', () => {
  const s = computeStats(stateWith());
  assert.deepEqual(s, {
    games: 0,
    best: 0,
    average: 0,
    currentStreak: 0,
    maxStreak: 0,
    recent: [],
  });
});

test('computeStats: aggregates games, best, rounded average', () => {
  const history = [
    { day: '20260710', score: 100 },
    { day: '20260711', score: 300 },
    { day: '20260712', score: 251 }, // avg (100+300+251)/3 = 217
  ];
  const s = computeStats(stateWith({ history, bestScore: 300, currentStreak: 3, maxStreak: 5 }));
  assert.equal(s.games, 3);
  assert.equal(s.best, 300);
  assert.equal(s.average, 217);
  assert.equal(s.currentStreak, 3);
  assert.equal(s.maxStreak, 5);
});

test('computeStats: recent is the last 10, newest first', () => {
  const history = Array.from({ length: 15 }, (_, i) => ({ day: `d${i}`, score: i }));
  const s = computeStats(stateWith({ history }));
  assert.equal(s.recent.length, 10);
  assert.equal(s.recent[0].day, 'd14'); // newest first
  assert.equal(s.recent.at(-1).day, 'd5'); // 10 back
});
