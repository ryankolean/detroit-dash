// Player — jump physics, coyote time, forgiving hitbox (§3).
// Pure simulation, no DOM. One action only in v1: jump.

import { PLAYER, WORLD } from '../constants.js';

/**
 * createPlayer — build the player sim. Tuning defaults come from constants.js;
 * pass overrides for tests. Pure and headless-steppable (§9).
 *
 * @param {Object} [opts] - tuning overrides merged over PLAYER + a groundY.
 * @returns {Object} player: { update(dt), jump(), hitbox(), x, y, vy, grounded, ... }
 */
export function createPlayer(opts = {}) {
  const t = { ...PLAYER, ...opts };
  const groundY = opts.groundY ?? WORLD.groundY;
  const restY = groundY - t.height; // y of the sprite's top when standing

  const p = {
    x: t.x,
    width: t.width,
    height: t.height,
    y: restY,
    vy: 0,
    grounded: true,
    sinceGround: 0, // seconds since last on the ground (for coyote time)

    jump() {
      if (p.grounded || p.sinceGround <= t.coyoteTime) {
        p.vy = t.jumpVelocity;
        p.grounded = false;
        p.sinceGround = t.coyoteTime + 1; // consume the coyote window
      }
    },

    update(dt, holding = true) {
      // Variable jump (v3.6): if the button is released while still rising, cap
      // the upward speed — a quick tap becomes a short hop, a hold rides the full
      // arc. Only clamps upward motion; never adds speed. `holding` defaults true
      // so callers that don't drive the button (tests, backdrop) get a full jump.
      if (!holding && !p.grounded && p.vy < t.jumpCutVelocity) p.vy = t.jumpCutVelocity;
      p.vy += t.gravity * dt;
      p.y += p.vy * dt;
      if (p.y >= restY) {
        // landed
        p.y = restY;
        p.vy = 0;
        p.grounded = true;
        p.sinceGround = 0;
      } else {
        p.grounded = false;
        p.sinceGround += dt;
      }
    },

    hitbox() {
      const i = t.hitboxInset;
      return { x: p.x + i, y: p.y + i, w: t.width - 2 * i, h: t.height - 2 * i };
    },

    // Full sprite AABB — used for the generous coin-pickup check (v1.1).
    box() {
      return { x: p.x, y: p.y, w: t.width, h: t.height };
    },
  };
  return p;
}
