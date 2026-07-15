// Parallax skyline test (v1.2). The skyline is cosmetic and must be generated
// from its OWN seed, never the gameplay stream — the determinism keystone
// (test/determinism.test.mjs, still pinned at 818) is what guards that isolation.
// Here we just check the skyline itself is well-formed and reproducible.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSkyline } from '../src/engine/skyline.js';
import { SKYLINE } from '../src/constants.js';

test('createSkyline: builds one strip per configured layer', () => {
  const sky = createSkyline();
  assert.equal(sky.layers.length, SKYLINE.layers.length);
  for (const layer of sky.layers) {
    assert.ok(layer.buildings.length > 0);
    assert.ok(layer.tileW > 0);
  }
});

test('createSkyline: same seed -> identical skyline', () => {
  const a = createSkyline(12345);
  const b = createSkyline(12345);
  assert.deepEqual(a, b);
});

test('createSkyline: different seed -> different skyline', () => {
  const a = createSkyline(1);
  const b = createSkyline(2);
  assert.notDeepEqual(a, b);
});

test('createSkyline: buildings sit on the layer baseline, within bounds', () => {
  const sky = createSkyline();
  sky.layers.forEach((layer, i) => {
    const cfg = SKYLINE.layers[i];
    for (const b of layer.buildings) {
      assert.equal(b.y, cfg.baseY - b.h); // rises from the baseline
      assert.ok(b.w >= cfg.minW && b.w <= cfg.maxW);
      assert.ok(b.h >= cfg.minH && b.h <= cfg.maxH);
    }
  });
});
