// Leaderboard helper tests (v2.0). Pure validation + board math. Run: npm test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeName,
  validateJumpSteps,
  upsertScore,
  rankOf,
  publicBoard,
  MAX_JUMP_STEPS,
} from '../src/leaderboard.js';

test('sanitizeName: clamps length, strips risky chars, falls back', () => {
  assert.equal(sanitizeName('  Ryan  '), 'Ryan');
  assert.equal(sanitizeName('a'.repeat(40)).length, 16);
  assert.equal(sanitizeName('<script>'), 'script'); // angle brackets stripped
  assert.equal(sanitizeName(''), 'Runner');
  assert.equal(sanitizeName(null), 'Runner');
  assert.equal(sanitizeName('   '), 'Runner');
});

test('sanitizeName: profanity -> Runner', () => {
  assert.equal(sanitizeName('shithead'), 'Runner');
});

test('validateJumpSteps: ascending unique ints in range pass', () => {
  assert.equal(validateJumpSteps([0, 5, 12, 99], 1000), true);
  assert.equal(validateJumpSteps([], 1000), true);
});

test('validateJumpSteps: rejects unsorted, dupes, out-of-range, non-ints', () => {
  assert.equal(validateJumpSteps([5, 3], 1000), false); // unsorted
  assert.equal(validateJumpSteps([5, 5], 1000), false); // duplicate
  assert.equal(validateJumpSteps([-1], 1000), false); // negative
  assert.equal(validateJumpSteps([1000], 1000), false); // >= maxSteps
  assert.equal(validateJumpSteps([1.5], 1000), false); // non-integer
  assert.equal(validateJumpSteps('nope', 1000), false); // not an array
});

test('validateJumpSteps: rejects an oversized timeline', () => {
  const big = Array.from({ length: MAX_JUMP_STEPS + 1 }, (_, i) => i);
  assert.equal(validateJumpSteps(big, MAX_JUMP_STEPS + 2), false);
});

test('upsertScore: sorts desc, caps, one entry per client (higher wins)', () => {
  let board = [];
  board = upsertScore(board, { name: 'A', score: 100, clientId: 'a' }, 3);
  board = upsertScore(board, { name: 'B', score: 300, clientId: 'b' }, 3);
  board = upsertScore(board, { name: 'C', score: 200, clientId: 'c' }, 3);
  assert.deepEqual(board.map((e) => e.clientId), ['b', 'c', 'a']);
  // client a improves
  board = upsertScore(board, { name: 'A', score: 500, clientId: 'a' }, 3);
  assert.equal(board[0].clientId, 'a');
  assert.equal(board.length, 3); // still capped
  assert.equal(board.filter((e) => e.clientId === 'a').length, 1); // no dupe
});

test('rankOf: 1-based rank or null', () => {
  const board = [
    { name: 'B', score: 300, clientId: 'b' },
    { name: 'A', score: 100, clientId: 'a' },
  ];
  assert.equal(rankOf(board, 'b'), 1);
  assert.equal(rankOf(board, 'a'), 2);
  assert.equal(rankOf(board, 'z'), null);
});

test('publicBoard: strips clientId, limits to top N', () => {
  const board = Array.from({ length: 30 }, (_, i) => ({
    name: `n${i}`,
    score: 100 - i,
    clientId: `c${i}`,
  }));
  const pub = publicBoard(board, 25);
  assert.equal(pub.length, 25);
  assert.equal(pub[0].clientId, undefined);
  assert.deepEqual(pub[0], { name: 'n0', score: 100 });
});
