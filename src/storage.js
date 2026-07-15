// Persistence + streak logic — localStorage (§6).
// Single namespaced key. All clock reads go through an injected `now` so streak
// rules are testable headless (§6, §9). DOM touch is limited to localStorage.

import { STORAGE_KEY } from './constants.js';

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
  // TODO(v1.0): read STORAGE_KEY from localStorage, JSON.parse, validate shape,
  // fall back to a fresh zero-state on missing/corrupt data. Never throw.
  void STORAGE_KEY;
  throw new Error('TODO(v1.0): implement load');
}

/**
 * save — serialize + write the save state.
 * @param {SaveState} state
 */
export function save(state) {
  // TODO(v1.0): JSON.stringify + write to STORAGE_KEY. Wrap in try/catch
  // (private mode / quota). Cap history to the last ~60 entries before writing.
  void state;
  throw new Error('TODO(v1.0): implement save');
}

/**
 * recordRun — apply a finished run to the save state and return the new state.
 * Streak rule (§6): +1 when lastPlayedDay was exactly yesterday; reset to 1 on a
 * gap; unchanged same-day. Updates bestScore/maxStreak and appends to history.
 *
 * @param {SaveState} prev
 * @param {{ todayKey: string, score: number }} run
 * @returns {SaveState}
 */
export function recordRun(prev, run) {
  // TODO(v1.0): implement the streak transition using todayKey vs prev.lastPlayedDay
  // (compute "yesterday" as a calendar-day delta, not string math). Keystone of
  // test/streak.test.mjs — keep it pure so it can be tested with crafted states.
  void prev;
  void run;
  throw new Error('TODO(v1.0): implement recordRun');
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
  // TODO(v1.0): return state.lastPlayedDay === todayKey.
  void state;
  void todayKey;
  throw new Error('TODO(v1.0): implement isLockedFor');
}
