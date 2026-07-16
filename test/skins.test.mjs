// Cosmetic skins + unlock test (v3.1). Pure storage helpers. Run: npm test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unlockedSkins, selectSkin, recordRun } from '../src/storage.js';

function stateWith(overrides = {}) {
  return {
    lastPlayedDay: null,
    currentStreak: 0,
    maxStreak: 0,
    bestScore: 0,
    history: [],
    totalIcons: 0,
    bestSegment: 0,
    skin: 'classic',
    ...overrides,
  };
}

test('classic is always unlocked; others start locked', () => {
  const u = unlockedSkins(stateWith());
  assert.ok(u.has('classic'));
  assert.ok(!u.has('steel'));
  assert.ok(!u.has('gold'));
});

test('skins unlock by their metric', () => {
  assert.ok(unlockedSkins(stateWith({ history: [1, 2, 3] })).has('steel')); // 3 games
  assert.ok(unlockedSkins(stateWith({ bestScore: 1000 })).has('vernor')); // best >= 1000
  assert.ok(unlockedSkins(stateWith({ totalIcons: 10 })).has('gold')); // 10 icons
  assert.ok(unlockedSkins(stateWith({ bestSegment: 5 })).has('midnight')); // segment 5
});

test('just-below thresholds stay locked', () => {
  assert.ok(!unlockedSkins(stateWith({ history: [1, 2] })).has('steel'));
  assert.ok(!unlockedSkins(stateWith({ bestScore: 999 })).has('vernor'));
  assert.ok(!unlockedSkins(stateWith({ totalIcons: 9 })).has('gold'));
});

test('selectSkin only applies an unlocked skin', () => {
  const locked = selectSkin(stateWith(), 'gold');
  assert.equal(locked.skin, 'classic'); // gold not unlocked -> unchanged
  const ok = selectSkin(stateWith({ totalIcons: 10 }), 'gold');
  assert.equal(ok.skin, 'gold');
});

test('recordRun accumulates lifetime icons + best segment', () => {
  const s0 = stateWith({ totalIcons: 4, bestSegment: 2 });
  const s1 = recordRun(s0, { todayKey: '20260715', score: 500, icons: 3, segment: 6 });
  assert.equal(s1.totalIcons, 7);
  assert.equal(s1.bestSegment, 6);
  const s2 = recordRun({ ...s1, lastPlayedDay: '20260715' }, {
    todayKey: '20260716',
    score: 100,
    icons: 1,
    segment: 1, // lower segment doesn't lower the best
  });
  assert.equal(s2.totalIcons, 8);
  assert.equal(s2.bestSegment, 6);
});

test('recordRun carries the selected skin forward', () => {
  const s0 = stateWith({ skin: 'steel', history: [1, 2, 3] });
  const s1 = recordRun(s0, { todayKey: '20260715', score: 500 });
  assert.equal(s1.skin, 'steel');
});
