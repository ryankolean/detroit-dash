// Player — jump physics, coyote time, forgiving hitbox (§3).
// Pure simulation, no DOM. One action only in v1: jump.

/**
 * createPlayer — build the player sim.
 * @param {Object} [opts] - tuning overrides (gravity, jumpVelocity, coyoteTimeMs) from constants.js (§3).
 * @returns {Object} player with { update(dt), jump(), y, vy, grounded, hitbox(), ... }
 */
export function createPlayer(opts) {
  // TODO(v1.0):
  //   - update(dt): apply gravity to vy, integrate y, land on the ground plane,
  //     track `grounded` and time-since-left-ground for coyote time.
  //   - jump(): only if grounded OR within the coyote-time window; apply jumpVelocity.
  //   - hitbox(): return an AABB slightly inset from the sprite (forgiving hitbox §3).
  //   Pull gravity / jumpVelocity / coyoteTimeMs from constants.js. Keep pure so
  //   it can be stepped headless for the determinism keystone (§9).
  void opts;
  throw new Error('TODO(v1.0): implement createPlayer');
}
