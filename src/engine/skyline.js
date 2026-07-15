// Pixel-art Detroit skyline (v1.3). Cosmetic parallax background generated from a
// FIXED cosmetic seed — never the gameplay stream, so obstacle/coin determinism
// is untouched (§4). Geometry only: a curated Detroit silhouette on the near
// layer (Renaissance Center cluster, gothic-spired One Detroit Center, the
// Penobscot antenna, brick riverfront towers) plus seeded filler, and a distant
// far layer. Colors + day/night come from the renderer's themes.

import { WORLD, SKYLINE, SKYLINE_SEED } from '../constants.js';
import { createRng } from './rng.js';

const B = SKYLINE.baseY;
const TILE = WORLD.width * SKYLINE.spanTiles;

// Curated near-layer landmarks, left -> right, within one tile. Heights are in
// world units up from the baseline. `type` drives the renderer's roof/detail.
// The Renaissance Center is the centerpiece: a tall round-topped central tower
// with a glass dome base, flanked by four shorter towers.
const LANDMARKS = [
  { x: 6, w: 74, h: 92, type: 'box' }, // riverfront convention block (Huntington Place)
  { x: 86, w: 54, h: 132, type: 'box' },
  { x: 146, w: 48, h: 118, type: 'brick' }, // older brick tower
  { x: 200, w: 58, h: 214, type: 'spires' }, // One Detroit Center (gothic twin spires)
  { x: 266, w: 40, h: 178, type: 'antenna' }, // Penobscot (red beacon antenna)
  { x: 312, w: 64, h: 138, type: 'box' },
  { x: 384, w: 68, h: 116, type: 'box' },
  // --- Renaissance Center cluster ---
  { x: 470, w: 34, h: 208, type: 'box' }, // flank
  { x: 508, w: 34, h: 226, type: 'box' }, // flank
  { x: 546, w: 56, h: 300, type: 'rencen' }, // central tower + dome
  { x: 606, w: 34, h: 226, type: 'box' }, // flank
  { x: 644, w: 34, h: 208, type: 'box' }, // flank
  // --- brick riverfront apartment towers (right) ---
  { x: 700, w: 68, h: 150, type: 'box' },
  { x: 776, w: 46, h: 202, type: 'brick' },
  { x: 828, w: 46, h: 196, type: 'brick' },
  { x: 880, w: 88, h: 120, type: 'brick' }, // low red riverfront block
];

/**
 * Build a pixel-art window grid for a building (relative cell coords). Lit state
 * is drawn from the cosmetic rng, so a given seed always yields the same lights.
 */
function makeWindows(rng, w, h, litProb) {
  const cellW = 5;
  const cellH = 7;
  const gapX = 4;
  const gapY = 5;
  const margin = 5;
  const cells = [];
  const cols = Math.floor((w - margin * 2 + gapX) / (cellW + gapX));
  const rows = Math.floor((h - margin * 2 + gapY) / (cellH + gapY));
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      cells.push({
        dx: margin + c * (cellW + gapX),
        dy: margin + r * (cellH + gapY),
        w: cellW,
        h: cellH,
        lit: rng.next() < litProb,
      });
    }
  }
  return cells;
}

/**
 * createSkyline — build the two parallax layers once.
 * @param {number} [seed] - cosmetic seed (defaults to SKYLINE_SEED).
 * @returns {{ layers: Array<{factor:number, tileW:number, buildings:Array}> }}
 */
export function createSkyline(seed = SKYLINE_SEED) {
  const rng = createRng(seed);

  // Near layer: curated landmarks + seeded filler out to the tile edge.
  const near = LANDMARKS.map((b) => ({
    x: b.x,
    y: B - b.h,
    w: b.w,
    h: b.h,
    type: b.type,
    windows: makeWindows(rng, b.w, b.h, 0.28),
  }));
  let x = 980;
  while (x < TILE - 10) {
    const w = rng.int(40, 78);
    const h = rng.int(90, 210);
    const type = rng.next() < 0.15 ? 'antenna' : 'box';
    near.push({ x, y: B - h, w, h, type, windows: makeWindows(rng, w, h, 0.24) });
    x += w + rng.int(8, 22);
  }

  // Far layer: distant, shorter, denser filler behind the landmarks.
  const far = [];
  x = 0;
  while (x < TILE - 6) {
    const w = rng.int(30, 62);
    const h = rng.int(50, 130);
    far.push({ x, y: B - h, w, h, type: 'box', windows: makeWindows(rng, w, h, 0.14) });
    x += w + rng.int(6, 16);
  }

  return {
    layers: [
      { factor: SKYLINE.farFactor, tileW: TILE, buildings: far },
      { factor: SKYLINE.nearFactor, tileW: TILE, buildings: near },
    ],
  };
}
