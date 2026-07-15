// Parallax Detroit skyline (v1.2). Cosmetic background layers, generated once
// from a FIXED cosmetic seed — never the gameplay rng stream, so obstacle/coin
// determinism is untouched (§4). Pure data generation; the renderer draws it.

import { WORLD, SKYLINE, SKYLINE_SEED } from '../constants.js';
import { createRng } from './rng.js';

/**
 * createSkyline — build the parallax layers once. Each layer is a strip of
 * building rects spanning `spanTiles` screen-widths; the renderer scrolls it by
 * the layer's parallax factor and wraps modulo the strip width.
 *
 * @param {number} [seed] - cosmetic seed (defaults to SKYLINE_SEED).
 * @returns {{ layers: Array<{factor:number,color:string,tileW:number,buildings:Array}> }}
 */
export function createSkyline(seed = SKYLINE_SEED) {
  const rng = createRng(seed);
  const tileW = WORLD.width * SKYLINE.spanTiles;

  const layers = SKYLINE.layers.map((cfg) => {
    const buildings = [];
    let x = 0;
    while (x < tileW) {
      const w = rng.int(cfg.minW, cfg.maxW);
      const h = rng.int(cfg.minH, cfg.maxH);
      // A few lit windows per building for a night-skyline feel.
      const windows = [];
      const cols = Math.max(1, Math.floor(w / 12));
      const rows = Math.max(1, Math.floor(h / 16));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (rng.next() < 0.18) {
            windows.push({ dx: 4 + c * 12, dy: 6 + r * 16 });
          }
        }
      }
      buildings.push({ x, w, h, y: cfg.baseY - h, windows });
      x += w + cfg.gap;
    }
    return { factor: cfg.factor, color: cfg.color, tileW, buildings };
  });

  return { layers };
}
