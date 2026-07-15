// Renderer — canvas draw (§7, §8). The ONLY engine module that touches the DOM
// besides input.js. v1.0: simple shapes / programmer-art, no parallax/particles (§7).

import { WORLD, SKYLINE } from '../constants.js';

const COLORS = {
  sky: '#0e2440',
  ground: '#13315c',
  groundLine: '#1d4e89',
  player: '#ff6b35', // Summit orange (§7)
  obstacle: '#8fb8de',
  coin: '#ffd166', // gold collectible (v1.1)
};

/**
 * createRenderer — bind to a canvas and return draw helpers. The only engine
 * module besides input that touches the DOM (§7, §8). Simple shapes for v1.0.
 *
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} renderer: { resize(), clear(), draw(world, player), scale }
 */
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  // Scale world units -> canvas backing pixels. World is WORLD.width x .height.
  let scale = 1;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || WORLD.width;
    const cssH = cssW * (WORLD.height / WORLD.width); // keep the 16:9-ish ratio
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    // Map (0,0)-(WORLD.width,WORLD.height) onto the backing store.
    scale = canvas.width / WORLD.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function clear() {
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  }

  function drawGround() {
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, WORLD.groundY, WORLD.width, WORLD.height - WORLD.groundY);
    ctx.fillStyle = COLORS.groundLine;
    ctx.fillRect(0, WORLD.groundY, WORLD.width, 3);
  }

  // Parallax skyline (v1.2): each layer scrolls by its factor and wraps modulo
  // its strip width. Drawn behind the ground so buildings rise from the horizon.
  function drawSkyline(skyline, distance) {
    if (!skyline) return;
    for (const layer of skyline.layers) {
      const off = (distance * layer.factor) % layer.tileW;
      for (const b of layer.buildings) {
        for (let k = 0; k < 2; k++) {
          const bx = b.x - off + k * layer.tileW;
          if (bx + b.w < 0 || bx > WORLD.width) continue;
          ctx.fillStyle = layer.color;
          ctx.fillRect(bx, b.y, b.w, b.h);
          ctx.fillStyle = SKYLINE.litWindow;
          for (const win of b.windows) ctx.fillRect(bx + win.dx, b.y + win.dy, 3, 4);
        }
      }
    }
  }

  function drawParticles(particles) {
    if (!particles) return;
    for (const p of particles.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function draw(world, player, skyline, particles) {
    clear();
    drawSkyline(skyline, world.distance || 0);
    drawGround();
    ctx.fillStyle = COLORS.obstacle;
    for (const o of world.obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);
    // Coins as gold diamonds so they read differently from square obstacles.
    ctx.fillStyle = COLORS.coin;
    for (const c of world.coins) {
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      ctx.beginPath();
      ctx.moveTo(cx, c.y);
      ctx.lineTo(c.x + c.w, cy);
      ctx.lineTo(cx, c.y + c.h);
      ctx.lineTo(c.x, cy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    drawParticles(particles);
  }

  resize();
  return { resize, clear, draw, get scale() { return scale; } };
}
