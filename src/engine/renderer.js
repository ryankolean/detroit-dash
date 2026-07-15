// Renderer — canvas draw (§7, §8). The ONLY engine module that touches the DOM
// besides input.js. v1.0: simple shapes / programmer-art, no parallax/particles (§7).

import { WORLD } from '../constants.js';

const COLORS = {
  player: '#ff6b35', // Summit orange (§7) — reads on both day + night skies
  coin: '#ffd166', // gold collectible (v1.1)
};

// Day/night skyline themes (v1.3), selected by Detroit local time. Same geometry,
// swapped palette: bright sky + teal river by day, deep navy + lit windows by night.
const THEMES = {
  day: {
    skyTop: '#3b7fc4', skyBot: '#cfe8f5',
    ground: '#2b8ca0', groundLine: '#63c6d6', // Detroit River teal
    far: '#8ba7bd', near: '#5f7a92', edge: '#43596f',
    brick: '#a5624e', dome: '#8fd7e2', glass: '#aecbe0',
    winLit: '#fbe9b0', winDim: 'rgba(255,255,255,0.16)', beacon: '#e8503a',
  },
  night: {
    skyTop: '#081426', skyBot: '#12325a',
    ground: '#0c1f38', groundLine: '#1d4e89',
    far: '#0e2038', near: '#16304e', edge: '#0a1a2e',
    brick: '#5a3129', dome: '#1f5f6e', glass: '#1b3b5c',
    winLit: '#ffd166', winDim: 'rgba(120,160,200,0.10)', beacon: '#ff5a3c',
  },
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

  function clear(t) {
    const g = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    g.addColorStop(0, t.skyTop);
    g.addColorStop(1, t.skyBot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  }

  function drawGround(t) {
    ctx.fillStyle = t.ground;
    ctx.fillRect(0, WORLD.groundY, WORLD.width, WORLD.height - WORLD.groundY);
    ctx.fillStyle = t.groundLine;
    ctx.fillRect(0, WORLD.groundY, WORLD.width, 3);
  }

  // One pixel-art building: body, window grid, and a landmark-specific top.
  // `detailed` = near layer (windows + roof detail); far layer only lights up.
  function drawBuilding(b, bx, layerFill, t, detailed) {
    const fill = b.type === 'brick' ? t.brick : layerFill;
    ctx.fillStyle = fill;
    ctx.fillRect(bx, b.y, b.w, b.h);

    for (const win of b.windows) {
      if (win.lit) {
        ctx.fillStyle = t.winLit;
        ctx.fillRect(bx + win.dx, b.y + win.dy, win.w, win.h);
      } else if (detailed) {
        ctx.fillStyle = t.winDim;
        ctx.fillRect(bx + win.dx, b.y + win.dy, win.w, win.h);
      }
    }
    if (!detailed) return;

    ctx.fillStyle = t.edge; // right-edge shadow for depth
    ctx.fillRect(bx + b.w - 2, b.y, 2, b.h);

    const cx = bx + b.w / 2;
    if (b.type === 'spires') {
      ctx.fillStyle = fill; // gothic twin spires (One Detroit Center)
      ctx.fillRect(cx - 9, b.y - 22, 4, 22);
      ctx.fillRect(cx + 5, b.y - 22, 4, 22);
      ctx.fillRect(cx - 3, b.y - 14, 6, 14);
    } else if (b.type === 'antenna') {
      ctx.fillStyle = fill; // Penobscot mast + red beacon
      ctx.fillRect(cx - 1.5, b.y - 30, 3, 30);
      ctx.fillStyle = t.beacon;
      ctx.fillRect(cx - 2.5, b.y - 34, 5, 5);
    } else if (b.type === 'rencen') {
      ctx.fillStyle = t.glass; // observation band
      ctx.fillRect(bx, b.y + 16, b.w, 7);
      ctx.fillStyle = fill; // cylindrical crown
      ctx.beginPath();
      ctx.ellipse(cx, b.y, b.w * 0.32, 9, 0, Math.PI, 0, true);
      ctx.fill();
      ctx.fillRect(cx - 1.5, b.y - 16, 3, 16); // roof mast
      ctx.fillStyle = t.dome; // Wintergarden glass dome at the base
      ctx.beginPath();
      ctx.arc(cx, WORLD.groundY, b.w * 0.52, Math.PI, 0);
      ctx.fill();
    }
  }

  // Parallax skyline (v1.3): far layer behind, curated near layer in front. Each
  // scrolls by its factor and wraps modulo its strip width.
  function drawSkyline(skyline, distance, t) {
    if (!skyline) return;
    const lastLayer = skyline.layers.length - 1;
    skyline.layers.forEach((layer, li) => {
      const near = li === lastLayer;
      const layerFill = near ? t.near : t.far;
      const off = (distance * layer.factor) % layer.tileW;
      for (const b of layer.buildings) {
        for (let k = 0; k < 2; k++) {
          const bx = b.x - off + k * layer.tileW;
          if (bx + b.w < 0 || bx > WORLD.width) continue;
          drawBuilding(b, bx, layerFill, t, near);
        }
      }
    });
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

  // Canvas-drawn obstacles (v1.2), themed by height so they read as hazards, not
  // as the player. Clipped to the collision box so shape never exceeds hitbox.
  function drawObstacle(o) {
    const { x, y, w, h } = o;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    if (h <= 40) {
      // Short hazard post — yellow/black vertical bands.
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#161616';
      for (let bx = x; bx < x + w; bx += 12) ctx.fillRect(bx, y, 6, h);
    } else if (h <= 56) {
      // Road barrier — red/white horizontal bands.
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ecf0f1';
      for (let by = y + 4; by < y + h; by += 16) ctx.fillRect(x, by, w, 8);
    } else {
      // Steel crate — gray with a riveted border + cross braces.
      ctx.fillStyle = '#7f93a8';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#465767';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      ctx.moveTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Canvas-drawn runner (v1.2): head, torso, swinging limbs. Legs cycle from the
  // scroll distance while grounded; tuck into a jump pose while airborne.
  function drawPlayer(p, distance) {
    const { x, y, width: w, height: h } = p;
    const cx = x + w / 2;
    const grounded = p.grounded !== false; // plain test objects (no field) run
    const swing = Math.sin((distance || 0) * 0.05);
    const hipY = y + h - 14;

    // Legs
    ctx.strokeStyle = '#c44a1e';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (grounded) {
      ctx.moveTo(cx - 3, hipY);
      ctx.lineTo(cx - 3 + swing * 7, y + h);
      ctx.moveTo(cx + 3, hipY);
      ctx.lineTo(cx + 3 - swing * 7, y + h);
    } else {
      ctx.moveTo(cx - 3, hipY);
      ctx.lineTo(cx - 7, y + h - 5);
      ctx.moveTo(cx + 3, hipY);
      ctx.lineTo(cx + 8, y + h - 7);
    }
    ctx.stroke();

    // Torso
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(x + 6, y + 12, w - 12, h - 26);

    // Trailing arm (swings opposite the legs)
    ctx.strokeStyle = '#c44a1e';
    ctx.beginPath();
    ctx.moveTo(cx + 2, y + 18);
    ctx.lineTo(cx + 2 + (grounded ? -swing * 8 : 10), y + 27);
    ctx.stroke();

    // Head + visor
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(cx, y + 9, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b1d33';
    ctx.fillRect(cx - 1, y + 6, 8, 4);
  }

  function draw(world, player, skyline, particles, themeName) {
    const t = THEMES[themeName] || THEMES.night;
    clear(t);
    drawSkyline(skyline, world.distance || 0, t);
    drawGround(t);
    for (const o of world.obstacles) drawObstacle(o);
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
    drawPlayer(player, world.distance || 0);
    drawParticles(particles);
  }

  resize();
  return { resize, clear, draw, get scale() { return scale; } };
}
