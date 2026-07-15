// World — deterministic obstacle spawn + scroll from the seeded RNG (§3, §4).
// Pure simulation, no DOM. ALL randomness comes from the injected rng stream;
// no Math.random() here (§4). Same seed -> identical spawn list (§9 snapshot test).

/**
 * createWorld — build the world sim for a run.
 * @param {Object} opts
 * @param {() => number} opts.rng - seeded stream from engine/rng.js (float [0,1)).
 * @returns {Object} world with { update(dt), obstacles, distance, speed, ... }
 */
export function createWorld(opts) {
  // TODO(v1.0): hold scroll position/distance, current speed (ramps with distance,
  // breakpoints drawn from rng), and the active obstacle list. On update(dt):
  //   - advance distance by speed*dt; increase speed per the ramp curve.
  //   - spawn the next obstacle when the scroll passes the next gap; gap size,
  //     obstacle type/dimensions all drawn from the rng stream (deterministic).
  //   - retire obstacles that scrolled off-screen.
  // Keep it headless-steppable so a fixed seed + scripted steps yields an
  // identical spawn list for the snapshot test (§9).
  void opts;
  throw new Error('TODO(v1.0): implement createWorld');
}
