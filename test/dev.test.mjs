// Dev-flag parsing test. getDevConfig reads URL query flags that bypass the
// one-shot lock for testing; it must stay inert with no query string. Run: npm test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDevConfig } from '../src/dev.js';

test('no query string -> dev disabled (production default)', () => {
  assert.deepEqual(getDevConfig(''), { enabled: false, day: null, seed: null });
});

test('?dev enables dev mode', () => {
  const c = getDevConfig('?dev');
  assert.equal(c.enabled, true);
  assert.equal(c.day, null);
  assert.equal(c.seed, null);
});

test('?day=YYYYMMDD overrides the course and implies dev', () => {
  const c = getDevConfig('?day=20260715');
  assert.equal(c.enabled, true);
  assert.equal(c.day, '20260715');
});

test('malformed ?day is ignored', () => {
  assert.equal(getDevConfig('?day=2026-07-15').day, null);
  assert.equal(getDevConfig('?day=abc').day, null);
  // ?day alone (no valid value) does not enable dev
  assert.equal(getDevConfig('?day=abc').enabled, false);
});

test('?seed sets a raw uint32 seed and implies dev', () => {
  const c = getDevConfig('?seed=12345');
  assert.equal(c.enabled, true);
  assert.equal(c.seed, 12345);
});

test('?seed is coerced to uint32', () => {
  assert.equal(getDevConfig('?seed=-1').seed, 0xffffffff); // wraps like mulberry32 input
  assert.equal(getDevConfig('?seed=4294967296').seed, 0); // wraps at 2^32
});

test('non-numeric ?seed is ignored', () => {
  const c = getDevConfig('?seed=abc');
  assert.equal(c.seed, null);
  assert.equal(c.enabled, false);
});

test('combined flags parse together', () => {
  const c = getDevConfig('?dev&day=20260101&seed=99');
  assert.deepEqual(c, { enabled: true, day: '20260101', seed: 99 });
});
