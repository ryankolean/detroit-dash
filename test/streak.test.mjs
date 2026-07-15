// Streak logic test (§6, §9). Verifies localStorage streak transitions via
// crafted save states — pure recordRun, no real clock or DOM. Run: npm test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordRun, previousDayKey } from '../src/storage.js';

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

test('previousDayKey: handles month + year boundaries', () => {
  assert.equal(previousDayKey('20260715'), '20260714');
  assert.equal(previousDayKey('20260301'), '20260228'); // non-leap Feb
  assert.equal(previousDayKey('20260101'), '20251231'); // year rollover
  assert.equal(previousDayKey('20240301'), '20240229'); // leap year
});

test('streak: consecutive day -> +1', () => {
  const prev = stateWith({
    lastPlayedDay: '20260714',
    currentStreak: 6,
    maxStreak: 6,
    bestScore: 900,
  });
  const next = recordRun(prev, { todayKey: '20260715', score: 1200 });
  assert.equal(next.currentStreak, 7);
  assert.equal(next.maxStreak, 7); // exceeded prior max
  assert.equal(next.bestScore, 1200);
  assert.equal(next.lastPlayedDay, '20260715');
});

test('streak: consecutive but lower score keeps prior best + max', () => {
  const prev = stateWith({
    lastPlayedDay: '20260714',
    currentStreak: 2,
    maxStreak: 10,
    bestScore: 5000,
  });
  const next = recordRun(prev, { todayKey: '20260715', score: 100 });
  assert.equal(next.currentStreak, 3);
  assert.equal(next.maxStreak, 10); // unchanged, 3 < 10
  assert.equal(next.bestScore, 5000); // unchanged, 100 < 5000
});

test('streak: gap (missed a day) -> reset to 1', () => {
  const prev = stateWith({
    lastPlayedDay: '20260712', // 3 days before today
    currentStreak: 9,
    maxStreak: 9,
  });
  const next = recordRun(prev, { todayKey: '20260715', score: 300 });
  assert.equal(next.currentStreak, 1);
  assert.equal(next.maxStreak, 9); // reset streak doesn't lower max
});

test('streak: first run ever -> streak 1', () => {
  const next = recordRun(stateWith(), { todayKey: '20260715', score: 42 });
  assert.equal(next.currentStreak, 1);
  assert.equal(next.maxStreak, 1);
  assert.equal(next.bestScore, 42);
});

test('streak: same day -> unchanged (one-shot lock)', () => {
  const prev = stateWith({
    lastPlayedDay: '20260715',
    currentStreak: 4,
    maxStreak: 8,
    bestScore: 2000,
    history: [{ day: '20260715', score: 2000 }],
  });
  const next = recordRun(prev, { todayKey: '20260715', score: 9999 });
  assert.equal(next, prev); // returns prev unchanged; no double-record
});

test('history is capped to 60 entries', () => {
  const history = Array.from({ length: 60 }, (_, i) => ({ day: `d${i}`, score: i }));
  const prev = stateWith({ lastPlayedDay: '20260714', currentStreak: 1, history });
  const next = recordRun(prev, { todayKey: '20260715', score: 500 });
  assert.equal(next.history.length, 60);
  assert.equal(next.history.at(-1).day, '20260715'); // newest kept
  assert.equal(next.history[0].day, 'd1'); // oldest dropped
});
