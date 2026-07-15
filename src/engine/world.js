// World — deterministic obstacle spawn + scroll from the seeded RNG (§3, §4).
// Pure simulation, no DOM. ALL randomness comes from the injected rng stream;
// no Math.random() here (§4). Same seed -> identical spawn list (§9 snapshot test).

import { WORLD, WORLD_TUNING, METERS_PER_UNIT, COIN } from '../constants.js';

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
    meters: 0, // distance in meters (distance score = floor(meters))
    speed: T.baseSpeed,
    obstacles: [], // active { x, y, w, h }, x in screen space
    coins: [], // active collectibles { x, y, w, h } (v1.1)
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

      // Coin cluster trailing the obstacle, all drawn from the seeded stream so
      // the collectible layout is identical for everyone (§4).
      const coinCount = rng.int(0, COIN.maxPerCluster);
      const elevated = rng.next() < 0.5;
      const coinY = elevated
        ? WORLD.groundY - COIN.elevatedY
        : WORLD.groundY - COIN.size;
      const before = w.coins.length;
      for (let i = 0; i < coinCount; i++) {
        w.coins.push({
          x: WORLD.width + COIN.leadOffset + i * COIN.clusterGap,
          y: coinY,
          w: COIN.size,
          h: COIN.size,
          icon: null,
        });
      }
      // Occasionally make the lead coin a Detroit-icon bonus token. One rng draw
      // gates it and picks the icon, so the collectible layout stays deterministic.
      const iconRoll = rng.next();
      if (coinCount > 0 && iconRoll < COIN.iconChance) {
        w.coins[before].icon = Math.floor((iconRoll / COIN.iconChance) * COIN.iconTypes);
      }
    },

    update(dt) {
      // Speed ramps with distance, capped.
      w.speed = Math.min(T.maxSpeed, T.baseSpeed + T.speedRampPerMeter * w.meters);
      const step = w.speed * dt;
      w.distance += step;
      w.meters = w.distance * METERS_PER_UNIT;

      // Scroll obstacles + coins left; retire off-screen obstacles. (Coins are
      // retired by resolveCoins when they pass the player; drop any stragglers.)
      for (const o of w.obstacles) o.x -= step;
      for (const c of w.coins) c.x -= step;
      w.obstacles = w.obstacles.filter((o) => o.x + o.w > 0);
      w.coins = w.coins.filter((c) => c.x + c.w > 0);

      // Spawn when enough scroll has elapsed.
      w.distToNextSpawn -= step;
      if (w.distToNextSpawn <= 0) w.spawn();
    },
  };
  return w;
}
