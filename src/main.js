// Detroit Dash — bootstrap / entry point (§8).
// Wires the pieces together: resolve today's puzzle, decide play-vs-locked,
// mount the canvas, run the loop or show the result/lock screen. This is the
// only module that assembles DOM + engine + storage; keep game rules in the
// engine modules, not here.

import { dayKey, seedFromDay, puzzleNumber, isDaytime } from './daily.js';
import { createLoop } from './engine/loop.js';
import { createPlayer } from './engine/player.js';
import { createSession } from './engine/session.js';
import { createRenderer } from './engine/renderer.js';
import { bindInput } from './engine/input.js';
import { createSkyline } from './engine/skyline.js';
import { createParticles } from './engine/particles.js';
import { createAudio } from './engine/audio.js';
import {
  load, save, recordRun, isLockedFor, computeStats,
  unlockedSkins, selectSkin, unlockedTrails, selectTrail,
} from './storage.js';
import { buildShareText, copyShareText } from './shareCard.js';
import { getDevConfig } from './dev.js';
import { fetchBoard, submitScore } from './net.js';
import { sanitizeName } from './leaderboard.js';
import { TIMEZONE, BACKEND_URL, CLIENT_KEY, SKINS, TRAILS } from './constants.js';

// --- DOM handles -----------------------------------------------------------
const canvas = document.getElementById('stage');
const hudPuzzle = document.getElementById('hud-puzzle');
const hudScore = document.getElementById('hud-score');
const hudStreak = document.getElementById('hud-streak');
const muteBtn = document.getElementById('mute-btn');
const statsBtn = document.getElementById('stats-btn');
const resultEl = document.getElementById('result');
const statsEl = document.getElementById('stats');
const hintEl = document.getElementById('hint');

// Respect reduced-motion: skip particle FX + card entrance animation (a11y v1.3).
const reduceMotion =
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Puzzle identity -------------------------------------------------------
// Dev flags (?dev / ?day= / ?seed=) let us test mechanics without the one-shot
// lock. Inert in production — the live URL carries no query string (see dev.js).
const dev = getDevConfig();
const now = new Date();
const today = dev.day ?? dayKey(now);
const puzzleNo = puzzleNumber(today);
const seed = dev.seed ?? seedFromDay(today);
let state = load();

hudPuzzle.textContent = `Detroit Dash #${puzzleNo}${dev.enabled ? ' · DEV' : ''}`;
hudStreak.textContent = `🔥 ${state.currentStreak}`;

const renderer = createRenderer(canvas);
window.addEventListener('resize', () => {
  renderer.resize();
  drawBackdrop();
});

// Cosmetic parallax skyline — built once from its own seed, shared across runs.
const skyline = createSkyline();

// Apply the selected cosmetic skin (v3.1) — player colors only, no sim effect.
function applySkin() {
  const skin = SKINS.find((sk) => sk.id === state.skin) || SKINS[0];
  renderer.setSkin(skin);
}
applySkin();

// Day vs night skyline variant, by current Detroit local time (v1.3).
const theme = isDaytime(now) ? 'day' : 'night';
document.body.dataset.daynight = theme; // lets CSS match the page frame

// A static backdrop so the skyline shows even behind the lock/result screen.
function drawBackdrop() {
  renderer.draw({ distance: 0, obstacles: [], coins: [] }, createPlayer(), skyline, null, theme);
}
drawBackdrop();

// Sound + persisted mute toggle (v1.2).
const audio = createAudio();
function renderMute() {
  muteBtn.textContent = audio.muted ? '🔇' : '🔊';
}
renderMute();
muteBtn.addEventListener('click', () => {
  audio.toggleMute();
  if (!audio.muted) audio.resume(); // unmuting is a gesture — warm the context
  renderMute();
});

// --- Countdown to the next Detroit midnight (§5, §6) -----------------------
function secondsUntilNextMidnight(when) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(when);
  const get = (t) => +parts.find((p) => p.type === t).value;
  const elapsed = get('hour') * 3600 + get('minute') * 60 + get('second');
  return 86400 - elapsed;
}

function formatHMS(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// --- Result / lock screen --------------------------------------------------
let countdownTimer = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

function showResult({ score, best, streak, alreadyPlayed, isNewBest = false, breakdown = null }) {
  if (countdownTimer !== null) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  const headline = alreadyPlayed ? "You've already played today" : 'Run over';
  const badge = isNewBest ? '<p class="result-badge">★ New personal best!</p>' : '';
  let breakdownRow = '';
  if (breakdown) {
    const bits = [`${breakdown.distance.toLocaleString('en-US')} m run`];
    if (breakdown.coins) bits.push(`${breakdown.coins} collected`);
    if (breakdown.icons) bits.push(`${breakdown.icons} icon${breakdown.icons > 1 ? 's' : ''}`);
    if (breakdown.maxMult > 1) bits.push(`best ×${breakdown.maxMult}`);
    breakdownRow = `<p class="result-breakdown">${bits.join(' · ')}</p>`;
  }
  const footer = dev.enabled
    ? '<button id="replay-btn" type="button" class="result-replay">Play again</button>'
    : '<p class="result-countdown">Next dash in <span id="countdown">--:--:--</span></p>';

  resultEl.innerHTML = `
    <div class="result-card">
      ${badge}
      <h2>${headline}</h2>
      <p class="result-score">${score.toLocaleString('en-US')} m</p>
      ${breakdownRow}
      <dl class="result-stats">
        <div><dt>Best</dt><dd>${best.toLocaleString('en-US')} m</dd></div>
        <div><dt>Streak</dt><dd>🔥 ${streak}</dd></div>
      </dl>
      <div class="result-actions">
        <button id="share-btn" type="button">Share</button>
        <button id="result-stats-btn" type="button" class="result-secondary">Stats</button>
      </div>
      <p class="result-share-status" id="share-status" aria-live="polite"></p>
      ${BACKEND_URL ? '<div id="board" class="result-board"></div>' : ''}
      ${footer}
    </div>`;
  resultEl.hidden = false;
  hintEl.hidden = true;

  const shareStatus = document.getElementById('share-status');
  const shareBtn = document.getElementById('share-btn');
  shareBtn.addEventListener('click', async () => {
    const text = buildShareText({ puzzleNumber: puzzleNo, distance: score, streak });
    try {
      await copyShareText(text);
      shareStatus.textContent = 'Copied to clipboard';
    } catch {
      shareStatus.textContent = 'Copy failed — select and copy manually';
    }
  });
  document.getElementById('result-stats-btn').addEventListener('click', openStats);
  shareBtn.focus(); // a11y: move focus into the result dialog

  if (dev.enabled) {
    document.getElementById('replay-btn').addEventListener('click', () => {
      resultEl.hidden = true;
      hintEl.hidden = false;
      startRun();
    });
    return;
  }

  const countdownEl = document.getElementById('countdown');
  const tick = () => {
    const remaining = secondsUntilNextMidnight(new Date());
    countdownEl.textContent = formatHMS(remaining);
    if (remaining <= 1) window.location.reload(); // new puzzle available
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

// --- Stats / history overlay (v1.3) ----------------------------------------
let statsLastFocus = null;

function formatDay(key) {
  if (!/^\d{8}$/.test(key)) return key;
  const d = new Date(Date.UTC(+key.slice(0, 4), +key.slice(4, 6) - 1, +key.slice(6, 8)));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function skinUnlockHint(skin) {
  const u = skin.unlock;
  if (!u) return '';
  if (u.type === 'games') return `Play ${u.value} games`;
  if (u.type === 'best') return `Best ${u.value.toLocaleString('en-US')} m`;
  if (u.type === 'icons') return `Collect ${u.value} icons`;
  if (u.type === 'segment') return `Reach segment ${u.value}`;
  return 'Locked';
}

function renderSkins() {
  const unlocked = unlockedSkins(state);
  return SKINS.map((sk) => {
    const isUnlocked = unlocked.has(sk.id);
    const isSelected = state.skin === sk.id;
    const cls = `skin-swatch${isSelected ? ' skin-selected' : ''}${isUnlocked ? '' : ' skin-locked'}`;
    const label = isUnlocked ? escapeHtml(sk.name) : `🔒 ${escapeHtml(skinUnlockHint(sk))}`;
    return `<button type="button" class="${cls}" data-skin="${sk.id}"${isUnlocked ? '' : ' disabled'}>
      <span class="skin-dot" style="background:${sk.body}"></span>
      <span class="skin-name">${label}</span>
    </button>`;
  }).join('');
}

function renderTrails() {
  const unlocked = unlockedTrails(state);
  return TRAILS.map((tr) => {
    const isUnlocked = unlocked.has(tr.id);
    const isSelected = state.trail === tr.id;
    const cls = `skin-swatch${isSelected ? ' skin-selected' : ''}${isUnlocked ? '' : ' skin-locked'}`;
    const label = isUnlocked ? escapeHtml(tr.name) : `🔒 ${escapeHtml(skinUnlockHint(tr))}`;
    const dot = tr.swatch === 'transparent'
      ? '<span class="skin-dot skin-dot-none"></span>'
      : `<span class="skin-dot" style="background:${tr.swatch}"></span>`;
    return `<button type="button" class="${cls}" data-trail="${tr.id}"${isUnlocked ? '' : ' disabled'}>
      ${dot}<span class="skin-name">${label}</span>
    </button>`;
  }).join('');
}

function openStats() {
  const s = computeStats(load());
  const rows = s.recent.length
    ? s.recent
        .map(
          (r) =>
            `<li><span>${escapeHtml(formatDay(r.day))}</span><span>${(r.score || 0).toLocaleString('en-US')} m</span></li>`,
        )
        .join('')
    : '<li class="stats-empty">No games yet — play today’s dash.</li>';
  statsEl.innerHTML = `
    <div class="stats-card">
      <div class="stats-head">
        <h2>Stats</h2>
        <button id="stats-close" type="button" aria-label="Close stats">✕</button>
      </div>
      <dl class="stats-grid">
        <div><dt>Games</dt><dd>${s.games}</dd></div>
        <div><dt>Best</dt><dd>${s.best.toLocaleString('en-US')} m</dd></div>
        <div><dt>Average</dt><dd>${s.average.toLocaleString('en-US')} m</dd></div>
        <div><dt>Streak</dt><dd>🔥 ${s.currentStreak}</dd></div>
        <div><dt>Max streak</dt><dd>${s.maxStreak}</dd></div>
      </dl>
      <h3>Skins</h3>
      <div class="skins-grid" id="skins-grid">${renderSkins()}</div>
      <h3>Trails</h3>
      <div class="skins-grid" id="trails-grid">${renderTrails()}</div>
      <h3>Recent runs</h3>
      <ol class="stats-list">${rows}</ol>
    </div>`;
  statsLastFocus = document.activeElement;
  statsEl.hidden = false;
  document.getElementById('stats-close').addEventListener('click', closeStats);
  document.getElementById('skins-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-skin]');
    if (!btn) return;
    state = selectSkin(state, btn.dataset.skin);
    save(state);
    applySkin();
    drawBackdrop();
    document.getElementById('skins-grid').innerHTML = renderSkins();
  });
  document.getElementById('trails-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-trail]');
    if (!btn) return;
    state = selectTrail(state, btn.dataset.trail);
    save(state);
    document.getElementById('trails-grid').innerHTML = renderTrails();
  });
  document.getElementById('stats-close').focus();
}

function closeStats() {
  statsEl.hidden = true;
  statsEl.innerHTML = '';
  if (statsLastFocus && typeof statsLastFocus.focus === 'function') statsLastFocus.focus();
}

statsBtn.addEventListener('click', openStats);
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !statsEl.hidden) closeStats();
});

// --- Global leaderboard (v2.0) ---------------------------------------------
// Anonymous identity: a display name + a persisted client token. Never an
// account or password (project rule) — the token just dedups the board.
function loadClient() {
  try {
    const raw = localStorage.getItem(CLIENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* private mode */
  }
  return { name: null, clientId: null };
}

function ensureClient() {
  const c = loadClient();
  if (!c.clientId) {
    c.clientId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `c-${Date.now()}-${Math.floor(performance.now())}`;
  }
  if (!c.name) {
    const input = window.prompt('Name for the leaderboard (max 16 characters):', '');
    if (input === null) return null; // cancelled -> skip submission
    c.name = sanitizeName(input);
  }
  try {
    localStorage.setItem(CLIENT_KEY, JSON.stringify(c));
  } catch {
    /* best effort */
  }
  return c;
}

function renderBoard(data, myRank) {
  const el = document.getElementById('board');
  if (!el) return;
  if (!data) {
    el.innerHTML = '<p class="board-status">Leaderboard unavailable</p>';
    return;
  }
  const entries = data.entries || [];
  const rows = entries.length
    ? entries
        .slice(0, 10)
        .map(
          (e, i) =>
            `<li${i + 1 === myRank ? ' class="board-me"' : ''}><span>${i + 1}. ${escapeHtml(e.name)}</span><span>${(e.score || 0).toLocaleString('en-US')} m</span></li>`,
        )
        .join('')
    : '<li class="board-empty">Be the first to post today.</li>';
  const rankLine =
    myRank && myRank > 10 ? `<p class="board-rank">Your rank: #${myRank}</p>` : '';
  el.innerHTML = `<h3>Today’s leaders</h3><ol class="board-list">${rows}</ol>${rankLine}`;
}

async function submitAndRenderBoard(day, jumpSteps) {
  if (!BACKEND_URL) return;
  const el = document.getElementById('board');
  const client = ensureClient();
  if (!client) {
    // Name prompt cancelled — just show the board read-only.
    renderBoardOnly(day);
    return;
  }
  if (el) el.innerHTML = '<p class="board-status">Submitting…</p>';
  const res = await submitScore(BACKEND_URL, {
    dayKey: day,
    jumpSteps,
    name: client.name,
    clientId: client.clientId,
  });
  renderBoard(res, res && res.rank);
}

async function renderBoardOnly(day) {
  if (!BACKEND_URL) return;
  const el = document.getElementById('board');
  if (el) el.innerHTML = '<p class="board-status">Loading…</p>';
  renderBoard(await fetchBoard(BACKEND_URL, day), null);
}

// --- Play a run ------------------------------------------------------------
function startRun() {
  // One session drives everything (world, player, scorer, gates, power-ups) —
  // the SAME code the Worker replays (§v3.0). See engine/session.js.
  const session = createSession(seed);
  const { player } = session;
  const particles = createParticles();
  const tapSteps = []; // recorded input timeline for replay-verified submit (v2.0)
  let pendingTap = false;
  let over = false;

  // Cosmetic trail config for this run (v3.1) — color from the trail, or the skin.
  const trailDef = TRAILS.find((tr) => tr.id === state.trail);
  const skinDef = SKINS.find((sk) => sk.id === state.skin) || SKINS[0];
  const trailCfg =
    trailDef && trailDef.id !== 'none'
      ? { ...trailDef, color: trailDef.color || skinDef.body }
      : null;

  // Input flags a tap; it's APPLIED at the next step boundary so the live run
  // matches replayScore(dayKey, tapSteps) exactly. A tap is a jump, or a gate
  // pick when a gate is open — the session decides.
  const onJump = () => {
    pendingTap = true;
  };
  const unbindInput = bindInput({ target: canvas, onJump });

  const loop = createLoop({
    update() {
      const tapped = pendingTap;
      pendingTap = false;
      const wasGrounded = player.grounded;
      if (tapped) tapSteps.push(session.stepCount);
      const r = session.step(tapped);
      if (r.jumped && wasGrounded) {
        if (!reduceMotion) particles.jump(player.x + player.width / 2, player.y + player.height);
        audio.jump();
      }
      if (r.picked) audio.coin(); // power-up chosen
      for (const c of r.collected) {
        if (!reduceMotion) particles.coin(c.x, c.y);
        audio.coin();
      }
      // Cosmetic trail streak behind the runner.
      if (trailCfg && !reduceMotion && r.alive) {
        particles.trail(player.x + 4, player.y + player.height * 0.55, trailCfg);
      }
      particles.update(1 / 60);
      if (!r.alive) endRun();
    },
    render() {
      renderer.draw(session.world, player, skyline, particles, theme, session);
      const total = session.score();
      const combo = session.scorer.multiplier > 1 ? ` ×${session.scorer.multiplier}` : '';
      hudScore.textContent = `${total.toLocaleString('en-US')} m${combo}`;
    },
  });

  function endRun() {
    if (over) return;
    over = true;
    // Death burst at the player, drawn once before the loop stops.
    if (!reduceMotion) particles.death(player.x + player.width / 2, player.y + player.height / 2);
    audio.death();
    renderer.draw(session.world, player, skyline, particles, theme, session);
    loop.stop();
    unbindInput();

    const distance = Math.floor(session.world.meters);
    const score = session.score();
    const breakdown = {
      distance,
      coins: session.scorer.coinsCollected,
      icons: session.scorer.iconsCollected,
      maxMult: session.scorer.maxMultiplier,
    };
    const isNewBest = score > state.bestScore && score > 0;

    if (dev.enabled) {
      // Don't persist — testing must not pollute real streak/best.
      showResult({
        score,
        best: Math.max(state.bestScore, score),
        streak: state.currentStreak,
        alreadyPlayed: false,
        isNewBest,
        breakdown,
      });
      return;
    }

    const next = recordRun(state, {
      todayKey: today,
      score,
      icons: session.scorer.iconsCollected,
      segment: session.segment,
    });
    save(next);
    state = next; // keep module state current (cosmetic unlocks + skin)
    hudStreak.textContent = `🔥 ${next.currentStreak}`;
    showResult({
      score,
      best: next.bestScore,
      streak: next.currentStreak,
      alreadyPlayed: false,
      isNewBest,
      breakdown,
    });
    submitAndRenderBoard(today, tapSteps); // replay-verified leaderboard (v2.0)
  }

  loop.start();
}

// --- Boot ------------------------------------------------------------------
if (!dev.enabled && isLockedFor(state, today)) {
  // One-shot lock: straight to the result/lock screen, no replay (§6).
  const played = state.history.find((h) => h.day === today);
  showResult({
    score: played ? played.score : 0,
    best: state.bestScore,
    streak: state.currentStreak,
    alreadyPlayed: true,
  });
  renderBoardOnly(today); // show today's board on the lock screen (v2.0)
} else {
  startRun();
}
