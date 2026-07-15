// Cosmetic particle FX (v1.2): jump dust, coin sparkle, death burst. NOT part of
// the sim — spread is non-deterministic (Math.random) and never touches score or
// course, so gameplay determinism (§4) is unaffected. The renderer draws these.

import { PARTICLES } from '../constants.js';

/**
 * createParticles — a small pooled particle system.
 * @returns {Object} { list, update(dt), jump(x,y), coin(x,y), death(x,y), clear() }
 */
export function createParticles() {
  const list = [];

  function emit(x, y, cfg, spread) {
    for (let i = 0; i < cfg.count; i++) {
      const angle = spread.from + Math.random() * (spread.to - spread.from);
      const speed = cfg.speed * (0.4 + Math.random() * 0.6);
      list.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: cfg.life,
        maxLife: cfg.life,
        size: cfg.size,
        color: cfg.color,
      });
    }
  }

  return {
    list,

    update(dt) {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.vy += PARTICLES.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) list.splice(i, 1);
      }
    },

    // Dust kicked backward + up from the feet on jump.
    jump(x, y) {
      emit(x, y, PARTICLES.jumpDust, { from: Math.PI * 0.9, to: Math.PI * 1.6 });
    },

    // Gold sparkle bursting outward when a coin is collected.
    coin(x, y) {
      emit(x, y, PARTICLES.coinSpark, { from: 0, to: Math.PI * 2 });
    },

    // Full radial burst on death.
    death(x, y) {
      emit(x, y, PARTICLES.deathBurst, { from: 0, to: Math.PI * 2 });
    },

    clear() {
      list.length = 0;
    },
  };
}
