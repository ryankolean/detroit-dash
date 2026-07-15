// Keystone RNG determinism test (§4, §9). Real, passing test — everything else in
// test/ is a skeleton for the next session. Run with: npm test (node --test).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/engine/rng.js';

function sequence(seed, n) {
  const next = mulberry32(seed);
  return Array.from({ length: n }, () => next());
}

test('mulberry32: same seed produces the same sequence', () => {
  const a = sequence(12345, 10);
  const b = sequence(12345, 10);
  assert.deepEqual(a, b);
});

test('mulberry32: different seeds produce different sequences', () => {
  const a = sequence(1, 10);
  const b = sequence(2, 10);
  assert.notDeepEqual(a, b);
});

test('mulberry32: output stays in [0, 1)', () => {
  const next = mulberry32(0xC0FFEE);
  for (let i = 0; i < 1000; i++) {
    const v = next();
    assert.ok(v >= 0 && v < 1, `value out of range: ${v}`);
  }
});

test('mulberry32: two independent instances with one seed stay in lockstep', () => {
  const a = mulberry32(999);
  const b = mulberry32(999);
  for (let i = 0; i < 100; i++) {
    assert.equal(a(), b());
  }
});
