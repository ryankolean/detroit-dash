// Collision — axis-aligned bounding-box checks (§3, §9).
// Pure math, no DOM. One collision ends the run.

/**
 * @typedef {{ x: number, y: number, w: number, h: number }} AABB
 */

/**
 * aabbIntersects — true if two axis-aligned boxes overlap.
 * @param {AABB} a
 * @param {AABB} b
 * @returns {boolean}
 */
export function aabbIntersects(a, b) {
  // TODO(v1.0): standard AABB overlap test —
  //   a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  //   Decide edge behavior (touching = miss, per forgiving-hitbox intent §3) and
  //   cover it in test/ (AABB hit/no-hit edge cases §9).
  void a;
  void b;
  throw new Error('TODO(v1.0): implement aabbIntersects');
}

/**
 * playerHitsAny — true if the player's (forgiving) hitbox hits any obstacle.
 * @param {AABB} playerHitbox
 * @param {AABB[]} obstacles
 * @returns {boolean}
 */
export function playerHitsAny(playerHitbox, obstacles) {
  // TODO(v1.0): return obstacles.some(o => aabbIntersects(playerHitbox, o)).
  void playerHitbox;
  void obstacles;
  throw new Error('TODO(v1.0): implement playerHitsAny');
}
