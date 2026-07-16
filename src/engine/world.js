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
    distToNextSpawn: T.gapFloor, // units of scroll until the next spawn

    spawn() {
      const width = rng.pick(T.obstacleWidths);
      const height = rng.pick(T.obstacleHeights);
      w.obstacles.push({
        x: WORLD.width,
        y: WORLD.groundY - height,
        w: width,
        h: height,
      });
      // Fair gap (v3.0): grows with speed so reaction time stays ~constant, plus
      // seeded variety. Obstacles never crowd, even at the speed cap.
      const reactionGap = Math.max(T.gapFloor, w.speed * T.reactionTime);
      w.distToNextSpawn = reactionGap + rng.range(0, T.gapVariety);

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

    update(dt, speedMult = 1) {
      // Speed ramps with distance, capped. speedMult applies power-ups (slow-mo).
      w.speed = Math.min(T.maxSpeed, T.baseSpeed + T.speedRampPerMeter * w.meters);
      const step = w.speed * speedMult * dt;
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
