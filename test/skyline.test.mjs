// Pixel-art skyline test (v1.3). Cosmetic, generated from its OWN seed — the
// determinism keystone (still 818) guards that it never touches the gameplay
// stream. Here we check structure, landmarks, and reproducibility.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSkyline } from '../src/engine/skyline.js';
import { SKYLINE } from '../src/constants.js';

test('createSkyline: two layers, far scrolls slower than near', () => {
  const s = createSkyline();
  assert.equal(s.layers.length, 2);
  assert.ok(s.layers[0].factor < s.layers[1].factor);
});

test('createSkyline: same seed -> identical skyline', () => {
  assert.deepEqual(createSkyline(777), createSkyline(777));
});

test('createSkyline: different seed -> different skyline (windows + filler)', () => {
  assert.notDeepEqual(createSkyline(1), createSkyline(2));
});

test('createSkyline: near layer includes curated Detroit landmarks', () => {
  const near = createSkyline().layers[1].buildings;
  const types = new Set(near.map((b) => b.type));
  assert.ok(types.has('rencen'), 'Renaissance Center present');
  assert.ok(types.has('spires'), 'gothic spires present');
  assert.ok(types.has('brick'), 'brick riverfront present');
});

test('createSkyline: every building rises from the baseline with windows', () => {
  for (const layer of createSkyline().layers) {
    assert.ok(layer.buildings.length > 0);
    for (const b of layer.buildings) {
      assert.equal(b.y, SKYLINE.baseY - b.h);
      assert.ok(Array.isArray(b.windows));
    }
  }
});
