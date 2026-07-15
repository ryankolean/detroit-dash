// Streak-combo scoring test (v1.1). Pure createScorer + resolveCoins. Run: npm test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScorer, resolveCoins } from '../src/engine/scoring.js';
import { COIN } from '../src/constants.js';

test('combo multiplier climbs one tier per comboStep coins, capped', () => {
  const s = createScorer();
  const seen = [];
  for (let i = 0; i < 12; i++) {
    s.collect();
    seen.push(s.multiplier);
  }
  // comboStep = 2, maxMult = 5: 1,1,2,2,3,3,4,4,5,5,5,5
  assert.deepEqual(seen, [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5]);
  assert.equal(s.coinsCollected, 12);
});

test('coin score accumulates base * multiplier per pickup', () => {
  const s = createScorer();
  s.collect(); // mult 1 -> +50
  s.collect(); // mult 1 -> +50
  s.collect(); // mult 2 -> +100
  assert.equal(s.coinScore, COIN.base * 1 + COIN.base * 1 + COIN.base * 2);
  assert.equal(s.coinScore, 200);
});

test('miss resets combo to x1 (the streak breaks)', () => {
  const s = createScorer();
  s.collect();
  s.collect();
  s.collect(); // mult 2
  assert.equal(s.multiplier, 2);
  s.miss();
  assert.equal(s.comboCount, 0);
  assert.equal(s.multiplier, 1);
  s.collect(); // back to base tier
  assert.equal(s.multiplier, 1);
  assert.equal(s.coinScore, 50 + 50 + 100 + 50);
});

test('icon token awards the icon bonus (x multiplier), still advances combo', () => {
  const s = createScorer();
  s.collect(); // plain coin, mult 1 -> +50
  s.collect(); // plain coin, mult 1 -> +50
  s.collect({ icon: 0 }); // icon, mult 2 -> +iconBonus*2
  assert.equal(s.iconsCollected, 1);
  assert.equal(s.coinsCollected, 3);
  assert.equal(s.multiplier, 2);
  assert.equal(s.coinScore, COIN.base + COIN.base + COIN.iconBonus * 2);
});

test('icon token with null icon is treated as a plain coin', () => {
  const s = createScorer();
  s.collect({ icon: null });
  assert.equal(s.iconsCollected, 0);
  assert.equal(s.coinScore, COIN.base);
});

test('total adds coin score to the distance score', () => {
  const s = createScorer();
  s.collect(); // +50
  assert.equal(s.total(1000), 1050);
  assert.equal(s.total(0), 50);
});

test('resolveCoins: overlap collects, mutates the coin list', () => {
  const s = createScorer();
  const playerBox = { x: 120, y: 336, w: 34, h: 44 };
  const coins = [{ x: 130, y: 350, w: 20, h: 20 }]; // overlaps player
  resolveCoins(coins, playerBox, s);
  assert.equal(coins.length, 0);
  assert.equal(s.coinsCollected, 1);
});

test('resolveCoins: a coin fully past the player is a miss', () => {
  const s = createScorer();
  s.collect(); // build a combo first
  s.collect();
  assert.equal(s.multiplier, 1);
  const playerBox = { x: 120, y: 336, w: 34, h: 44 };
  const coins = [{ x: 90, y: 350, w: 20, h: 20 }]; // x+w=110 < 120 -> passed
  resolveCoins(coins, playerBox, s);
  assert.equal(coins.length, 0);
  assert.equal(s.comboCount, 0); // combo broke
});

test('resolveCoins: a coin still ahead is left untouched', () => {
  const s = createScorer();
  const playerBox = { x: 120, y: 336, w: 34, h: 44 };
  const coins = [{ x: 400, y: 230, w: 20, h: 20 }]; // ahead, no overlap
  resolveCoins(coins, playerBox, s);
  assert.equal(coins.length, 1);
  assert.equal(s.coinsCollected, 0);
  assert.equal(s.comboCount, 0);
});
