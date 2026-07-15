// Game loop — fixed-timestep requestAnimationFrame (§8).
// Deterministic update at a fixed dt, decoupled from render. Pure timing glue;
// no game rules live here.

/**
 * createLoop — build a fixed-timestep loop.
 * @param {Object} opts
 * @param {(dt: number) => void} opts.update - called 0+ times per frame at fixed dt.
 * @param {(alpha: number) => void} opts.render - called once per frame; alpha = interpolation factor.
 * @param {number} [opts.dt] - fixed update step in seconds (e.g. 1/60).
 * @returns {{ start: () => void, stop: () => void }}
 */
export function createLoop(opts) {
  // TODO(v1.0): accumulator loop —
  //   accumulate frame time, run update(dt) while accumulator >= dt, then
  //   render(accumulator / dt). Use performance.now(); clamp huge frame gaps
  //   (tab-switch) so the sim doesn't spiral. requestAnimationFrame to drive it.
  //   start() begins the rAF; stop() cancels it. Keep update() pure of rAF so
  //   the engine can also be stepped manually in tests (determinism keystone §9).
  void opts;
  throw new Error('TODO(v1.0): implement createLoop');
}
