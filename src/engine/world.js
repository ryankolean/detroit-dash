// World — deterministic obstacle spawn + scroll from the seeded RNG (§3, §4).
// Pure simulation, no DOM. ALL randomness comes from the injected rng stream;
// no Math.random() here (§4). Same seed -> identical spawn list (§9 snapshot test).

import { WORLD, WORLD_TUNING, METERS_PER_UNIT } from '../constants.js';

/**
 * createWorld — build the world sim for a run. Deterministic given a seeded rng
 * stepped at a fixed dt (§4, §9).
 *
 * @param {Object} opts
 * @param {{ range:Function, int:Function, pick:Function }} opts.rng - seeded rng stream.
 * @returns {Object} world: { update(dt), obstacles, distance, meters, speed, ... }
 */
export function createWorld(opts) {
  const rng = opts.rng;
  const T = WORLD_TUNING;

  const w = {
    distance: 0, // total world-units scrolled
    meters: 0, // distance in meters (score = floor(meters))
    speed: T.baseSpeed,
    obstacles: [], // active { x, y, w, h }, x in screen space
    distToNextSpawn: T.gapMin, // units of scroll until the next spawn

    spawn() {
      const width = rng.pick(T.obstacleWidths);
      const height = rng.pick(T.obstacleHeights);
      w.obstacles.push({
        x: WORLD.width,
        y: WORLD.groundY - height,
        w: width,
        h: height,
      });
      // Gap to the next one narrows a little as speed climbs, floored at gapMin.
      const tighten = (w.speed - T.baseSpeed) / (T.maxSpeed - T.baseSpeed); // 0..1
      const gapMax = T.gapMax - (T.gapMax - T.gapMin) * 0.5 * tighten;
      w.distToNextSpawn = rng.range(T.gapMin, gapMax);
    },

    update(dt) {
      // Speed ramps with distance, capped.
      w.speed = Math.min(T.maxSpeed, T.baseSpeed + T.speedRampPerMeter * w.meters);
      const step = w.speed * dt;
      w.distance += step;
      w.meters = w.distance * METERS_PER_UNIT;

      // Scroll obstacles left; retire off-screen ones.
      for (const o of w.obstacles) o.x -= step;
      w.obstacles = w.obstacles.filter((o) => o.x + o.w > 0);

      // Spawn when enough scroll has elapsed.
      w.distToNextSpawn -= step;
      if (w.distToNextSpawn <= 0) w.spawn();
    },
  };
  return w;
}
