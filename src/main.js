// Detroit Dash — bootstrap / entry point (§8).
// Wires the pieces together: resolve today's puzzle, decide play-vs-locked,
// mount the canvas, run the loop or show the result/lock screen. This is the
// only module that assembles DOM + engine + storage; keep game rules in the
// engine modules, not here.

import { dayKey, seedFromDay, puzzleNumber } from './daily.js';
import { createRng } from './engine/rng.js';
import { createLoop } from './engine/loop.js';
import { createWorld } from './engine/world.js';
import { createPlayer } from './engine/player.js';
import { createRenderer } from './engine/renderer.js';
import { bindInput } from './engine/input.js';
import { playerHitsAny } from './engine/collision.js';
import { createScorer, resolveCoins } from './engine/scoring.js';
import { createSkyline } from './engine/skyline.js';
import { createParticles } from './engine/particles.js';
import { load, save, recordRun, isLockedFor } from './storage.js';
import { buildShareText, copyShareText } from './shareCard.js';
import { getDevConfig } from './dev.js';
import { TIMEZONE } from './constants.js';

// --- DOM handles -----------------------------------------------------------
const canvas = document.getElementById('stage');
const hudPuzzle = document.getElementById('hud-puzzle');
const hudScore = document.getElementById('hud-score');
const hudStreak = document.getElementById('hud-streak');
const resultEl = document.getElementById('result');
const hintEl = document.getElementById('hint');

// --- Puzzle identity -------------------------------------------------------
// Dev flags (?dev / ?day= / ?seed=) let us test mechanics without the one-shot
// lock. Inert in production — the live URL carries no query string (see dev.js).
const dev = getDevConfig();
const now = new Date();
const today = dev.day ?? dayKey(now);
const puzzleNo = puzzleNumber(today);
const seed = dev.seed ?? seedFromDay(today);
const state = load();

hudPuzzle.textContent = `Detroit Dash #${puzzleNo}${dev.enabled ? ' · DEV' : ''}`;
hudStreak.textContent = `🔥 ${state.currentStreak}`;

const renderer = createRenderer(canvas);
window.addEventListener('resize', () => renderer.resize());

// Cosmetic parallax skyline — built once from its own seed, shared across runs.
const skyline = createSkyline();

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

function showResult({ score, best, streak, alreadyPlayed }) {
  if (countdownTimer !== null) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  const headline = alreadyPlayed
    ? "You've already played today"
    : 'Run over';
  // Dev mode: unlimited replays -> a Play again button instead of the countdown.
  const footer = dev.enabled
    ? '<button id="replay-btn" type="button" class="result-replay">Play again</button>'
    : '<p class="result-countdown">Next dash in <span id="countdown">--:--:--</span></p>';
  resultEl.innerHTML = `
    <div class="result-card">
      <h2>${headline}</h2>
      <p class="result-score">${score.toLocaleString('en-US')} m</p>
      <dl class="result-stats">
        <div><dt>Best</dt><dd>${best.toLocaleString('en-US')} m</dd></div>
        <div><dt>Streak</dt><dd>🔥 ${streak}</dd></div>
      </dl>
      <button id="share-btn" type="button">Share</button>
      <p class="result-share-status" id="share-status" aria-live="polite"></p>
      ${footer}
    </div>`;
  resultEl.hidden = false;
  hintEl.hidden = true;

  const shareBtn = document.getElementById('share-btn');
  const shareStatus = document.getElementById('share-status');
  shareBtn.addEventListener('click', async () => {
    const text = buildShareText({ puzzleNumber: puzzleNo, distance: score, streak });
    try {
      await copyShareText(text);
      shareStatus.textContent = 'Copied to clipboard';
    } catch {
      shareStatus.textContent = 'Copy failed — select and copy manually';
    }
  });

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

// --- Play a run ------------------------------------------------------------
function startRun() {
  const rng = createRng(seed);
  const world = createWorld({ rng });
  const player = createPlayer();
  const scorer = createScorer();
  const particles = createParticles();
  let over = false;

  const onJump = () => {
    if (player.grounded) particles.jump(player.x + player.width / 2, player.y + player.height);
    player.jump();
  };
  const unbindInput = bindInput({ target: canvas, onJump });

  const loop = createLoop({
    update(dt) {
      world.update(dt);
      player.update(dt);
      const got = resolveCoins(world.coins, player.box(), scorer); // collect / break combo
      for (const c of got) particles.coin(c.x, c.y); // sparkle FX
      particles.update(dt);
      if (playerHitsAny(player.hitbox(), world.obstacles)) {
        endRun();
      }
    },
    render() {
      renderer.draw(world, player, skyline, particles);
      const total = scorer.total(Math.floor(world.meters));
      const combo = scorer.multiplier > 1 ? ` ×${scorer.multiplier}` : '';
      hudScore.textContent = `${total.toLocaleString('en-US')} m${combo}`;
    },
  });

  function endRun() {
    if (over) return;
    over = true;
    // Death burst at the player, drawn once before the loop stops.
    particles.death(player.x + player.width / 2, player.y + player.height / 2);
    renderer.draw(world, player, skyline, particles);
    loop.stop();
    unbindInput();
    const score = scorer.total(Math.floor(world.meters));

    if (dev.enabled) {
      // Don't persist — testing must not pollute real streak/best. Show the run
      // score against the untouched stored stats.
      showResult({
        score,
        best: Math.max(state.bestScore, score),
        streak: state.currentStreak,
        alreadyPlayed: false,
      });
      return;
    }

    const next = recordRun(state, { todayKey: today, score });
    save(next);
    hudStreak.textContent = `🔥 ${next.currentStreak}`;
    showResult({
      score,
      best: next.bestScore,
      streak: next.currentStreak,
      alreadyPlayed: false,
    });
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
} else {
  startRun();
}
