// Share-card test (§5, glyph bar v1.1). Pure string building. Run: npm test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildShareText, scoreTierBar } from '../src/shareCard.js';
import { PLAY_URL } from '../src/constants.js';

test('scoreTierBar lights one glyph per threshold cleared', () => {
  assert.equal(scoreTierBar(0), '⬛⬛⬛⬛⬛'); // below the first threshold (1)
  assert.equal(scoreTierBar(1), '🟧⬛⬛⬛⬛');
  assert.equal(scoreTierBar(750), '🟧🟧⬛⬛⬛'); // >=1, >=500
  assert.equal(scoreTierBar(1200), '🟧🟧🟧⬛⬛'); // >=1000
  assert.equal(scoreTierBar(5000), '🟧🟧🟧🟧🟧'); // clears all
});

test('buildShareText assembles the four spoiler-free lines', () => {
  const text = buildShareText({ puzzleNumber: 142, distance: 1240, streak: 7 });
  assert.equal(
    text,
    ['Detroit Dash #142', '1,240 m · 🔥 7-day streak', '🟧🟧🟧⬛⬛', PLAY_URL].join('\n'),
  );
});

test('buildShareText never reveals course detail', () => {
  const text = buildShareText({ puzzleNumber: 1, distance: 3333, streak: 1 });
  // Only puzzle #, score, streak, tier bar, url — no obstacle/coin coordinates.
  assert.ok(!/obstacle|coin|x:|y:/i.test(text));
  assert.ok(text.includes('3,333 m'));
});
