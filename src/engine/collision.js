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
  // Strict inequalities: exactly-touching edges count as a miss (forgiving §3).
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/**
 * playerHitsAny — true if the player's (forgiving) hitbox hits any obstacle.
 * @param {AABB} playerHitbox
 * @param {AABB[]} obstacles
 * @returns {boolean}
 */
export function playerHitsAny(playerHitbox, obstacles) {
  return obstacles.some((o) => aabbIntersects(playerHitbox, o));
}
