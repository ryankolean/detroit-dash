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
  const dt = opts.dt ?? 1 / 60;
  const { update, render } = opts;
  const MAX_FRAME = 0.25; // clamp tab-switch gaps so the sim can't spiral

  let rafId = null;
  let stopped = false; // stop() may be called from inside update() — see below
  let last = 0;
  let acc = 0;

  function frame(nowMs) {
    if (stopped) return;
    const now = nowMs / 1000;
    let delta = now - last;
    last = now;
    if (delta > MAX_FRAME) delta = MAX_FRAME;
    acc += delta;
    while (acc >= dt) {
      update(dt);
      // update() can end the run and call stop() mid-batch; bail immediately so we
      // don't render a post-stop frame or reschedule a zombie loop.
      if (stopped) return;
      acc -= dt;
    }
    render(acc / dt); // interpolation alpha
    if (!stopped) rafId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (rafId !== null) return;
      stopped = false;
      last = performance.now() / 1000;
      acc = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      stopped = true; // reliably prevents the in-flight frame() from rescheduling
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
