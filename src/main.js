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
import { load, save, recordRun, isLockedFor } from './storage.js';
import { buildShareText, copyShareText } from './shareCard.js';
import { TIMEZONE } from './constants.js';

// --- DOM handles -----------------------------------------------------------
const canvas = document.getElementById('stage');
const hudPuzzle = document.getElementById('hud-puzzle');
const hudScore = document.getElementById('hud-score');
const hudStreak = document.getElementById('hud-streak');
const resultEl = document.getElementById('result');
const hintEl = document.getElementById('hint');

// --- Puzzle identity -------------------------------------------------------
const now = new Date();
const today = dayKey(now);
const puzzleNo = puzzleNumber(today);
const state = load();

hudPuzzle.textContent = `Detroit Dash #${puzzleNo}`;
hudStreak.textContent = `🔥 ${state.currentStreak}`;

const renderer = createRenderer(canvas);
window.addEventListener('resize', () => renderer.resize());

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
  const headline = alreadyPlayed
    ? "You've already played today"
    : 'Run over';
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
      <p class="result-countdown">Next dash in <span id="countdown">--:--:--</span></p>
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
  const rng = createRng(seedFromDay(today));
  const world = createWorld({ rng });
  const player = createPlayer();
  let over = false;

  const unbindInput = bindInput({ target: canvas, onJump: () => player.jump() });

  const loop = createLoop({
    update(dt) {
      world.update(dt);
      player.update(dt);
      if (playerHitsAny(player.hitbox(), world.obstacles)) {
        endRun();
      }
    },
    render() {
      renderer.draw(world, player);
      hudScore.textContent = `${Math.floor(world.meters).toLocaleString('en-US')} m`;
    },
  });

  function endRun() {
    if (over) return;
    over = true;
    loop.stop();
    unbindInput();
    const score = Math.floor(world.meters);
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
if (isLockedFor(state, today)) {
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
