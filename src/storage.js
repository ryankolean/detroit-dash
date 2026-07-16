// Persistence + streak logic — localStorage (§6).
// Single namespaced key. All clock reads go through an injected `now` so streak
// rules are testable headless (§6, §9). DOM touch is limited to localStorage.

import { STORAGE_KEY, SKINS } from './constants.js';

const HISTORY_CAP = 60;

/** A fresh zero-state save (§6, cosmetic fields v3.1). */
function zeroState() {
  return {
    lastPlayedDay: null,
    currentStreak: 0,
    maxStreak: 0,
    bestScore: 0,
    history: [],
    totalIcons: 0, // lifetime Detroit-icon tokens collected (skin unlocks)
    bestSegment: 0, // deepest segment reached in a run (skin unlocks)
    skin: 'classic', // selected cosmetic skin
  };
}

/**
 * computeStats — aggregate the save state for the stats screen (v1.3). Pure.
 * @param {SaveState} state
 * @returns {{ games:number, best:number, average:number, currentStreak:number,
 *             maxStreak:number, recent:Array<{day:string,score:number}> }}
 */
export function computeStats(state) {
  const history = Array.isArray(state.history) ? state.history : [];
  const games = history.length;
  const total = history.reduce((sum, h) => sum + (h.score || 0), 0);
  return {
    games,
    best: state.bestScore || 0,
    average: games ? Math.round(total / games) : 0,
    currentStreak: state.currentStreak || 0,
    maxStreak: state.maxStreak || 0,
    recent: history.slice(-10).reverse(), // newest first
  };
}

/**
 * previousDayKey — the calendar day before a "YYYYMMDD" key. Uses UTC-midnight
 * epoch math on the plain Y/M/D, so no timezone/DST enters (a calendar day is a
 * calendar day). Exported for tests.
 * @param {string} key - "YYYYMMDD"
 * @returns {string} the prior day's key
 */
export function previousDayKey(key) {
  const y = +key.slice(0, 4);
  const m = +key.slice(4, 6);
  const d = +key.slice(6, 8);
  const prev = new Date(Date.UTC(y, m - 1, d - 1));
  const yyyy = prev.getUTCFullYear();
  const mm = String(prev.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(prev.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * @typedef {Object} SaveState
 * @property {string}  lastPlayedDay  - day key "YYYYMMDD" of the last completed run.
 * @property {number}  currentStreak
 * @property {number}  maxStreak
 * @property {number}  bestScore
 * @property {{day:string, score:number}[]} history - capped to ~60 (§6).
 */

/**
 * load — read + parse the save state, or a fresh zero-state if none/corrupt.
 * @returns {SaveState}
 */
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return zeroState();
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object') return zeroState();
    // Shallow shape validation with zero-state fallbacks for any missing field.
    return {
      lastPlayedDay: typeof s.lastPlayedDay === 'string' ? s.lastPlayedDay : null,
      currentStreak: Number.isFinite(s.currentStreak) ? s.currentStreak : 0,
      maxStreak: Number.isFinite(s.maxStreak) ? s.maxStreak : 0,
      bestScore: Number.isFinite(s.bestScore) ? s.bestScore : 0,
      history: Array.isArray(s.history) ? s.history : [],
      totalIcons: Number.isFinite(s.totalIcons) ? s.totalIcons : 0,
      bestSegment: Number.isFinite(s.bestSegment) ? s.bestSegment : 0,
      skin: typeof s.skin === 'string' ? s.skin : 'classic',
    };
  } catch {
    return zeroState();
  }
}

/**
 * save — serialize + write the save state.
 * @param {SaveState} state
 */
export function save(state) {
  try {
    const capped = {
      ...state,
      history: state.history.slice(-HISTORY_CAP),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // private mode / quota — persistence is best-effort, never throw.
  }
}

/**
 * recordRun — apply a finished run to the save state and return the new state.
 * Streak rule (§6): +1 when lastPlayedDay was exactly yesterday; reset to 1 on a
 * gap; unchanged same-day. Updates bestScore/maxStreak and appends to history.
 *
 * Also accumulates lifetime cosmetic-unlock stats (v3.1): totalIcons, bestSegment.
 *
 * @param {SaveState} prev
 * @param {{ todayKey: string, score: number, icons?: number, segment?: number }} run
 * @returns {SaveState}
 */
export function recordRun(prev, run) {
  const { todayKey, score, icons = 0, segment = 0 } = run;

  // Same-day replay guard: never double-record today's one-shot (§6).
  if (prev.lastPlayedDay === todayKey) return prev;

  let currentStreak;
  if (prev.lastPlayedDay && prev.lastPlayedDay === previousDayKey(todayKey)) {
    currentStreak = prev.currentStreak + 1; // played yesterday -> continue
  } else {
    currentStreak = 1; // first run ever, or a gap -> reset
  }

  return {
    ...prev, // carry cosmetic fields (skin) forward
    lastPlayedDay: todayKey,
    currentStreak,
    maxStreak: Math.max(prev.maxStreak, currentStreak),
    bestScore: Math.max(prev.bestScore, score),
    history: [...prev.history, { day: todayKey, score }].slice(-HISTORY_CAP),
    totalIcons: (prev.totalIcons || 0) + icons,
    bestSegment: Math.max(prev.bestSegment || 0, segment),
  };
}

/**
 * unlockedSkins — the set of skin ids the state has unlocked (v3.1). Pure.
 * @param {SaveState} state
 * @returns {Set<string>}
 */
export function unlockedSkins(state) {
  const games = Array.isArray(state.history) ? state.history.length : 0;
  const metrics = {
    games,
    best: state.bestScore || 0,
    icons: state.totalIcons || 0,
    segment: state.bestSegment || 0,
  };
  const out = new Set();
  for (const skin of SKINS) {
    if (!skin.unlock || metrics[skin.unlock.type] >= skin.unlock.value) out.add(skin.id);
  }
  return out;
}

/**
 * selectSkin — pure: return state with `skin` set, only if it's unlocked.
 * @param {SaveState} state
 * @param {string} id
 * @returns {SaveState}
 */
export function selectSkin(state, id) {
  if (!unlockedSkins(state).has(id)) return state;
  return { ...state, skin: id };
}

/**
 * isLockedFor — true if today's one-shot has already been played (§6).
 * When true, main.js boots straight to the result screen + countdown, no replay.
 *
 * @param {SaveState} state
 * @param {string} todayKey
 * @returns {boolean}
 */
export function isLockedFor(state, todayKey) {
  return state.lastPlayedDay === todayKey;
}
