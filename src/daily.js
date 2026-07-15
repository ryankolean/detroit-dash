// Daily puzzle identity — day key, seed, puzzle number (§4).
// Pure logic. All clock reads come in through an injected `now` (a Date) so this
// is testable headless with no real clock (§6, §8). No DOM.

import { LAUNCH_EPOCH, TIMEZONE } from './constants.js';

/**
 * dayKey — the America/Detroit calendar day as `YYYYMMDD` (§4).
 * The puzzle rolls over at Detroit local midnight for everyone.
 *
 * @param {Date} now - injected clock (defaults to new Date()).
 * @returns {string} e.g. "20260715"
 */
export function dayKey(now = new Date()) {
  // TODO(v1.0): format `now` in TIMEZONE using Intl.DateTimeFormat with
  // { timeZone: TIMEZONE, year:'numeric', month:'2-digit', day:'2-digit' } and
  // concatenate to YYYYMMDD. Do NOT hand-roll DST math — let Intl handle it.
  void now;
  void TIMEZONE;
  throw new Error('TODO(v1.0): implement dayKey');
}

/**
 * seedFromDay — deterministic 32-bit uint seed derived from a day key (§4).
 * Feeds mulberry32. Same day key -> same seed -> identical course.
 *
 * @param {string} dayKeyStr - e.g. "20260715"
 * @returns {number} 32-bit unsigned integer
 */
export function seedFromDay(dayKeyStr) {
  // TODO(v1.0): hash the day-key string into a well-distributed uint32 (e.g.
  // an FNV-1a or xmur3 pass). Avoid using the raw integer YYYYMMDD directly —
  // adjacent days should not produce near-identical streams.
  void dayKeyStr;
  throw new Error('TODO(v1.0): implement seedFromDay');
}

/**
 * puzzleNumber — "Detroit Dash #N", where N = daysSince(LAUNCH_EPOCH) (§4).
 *
 * @param {string} dayKeyStr - e.g. "20260715"
 * @returns {number} whole number of days since LAUNCH_EPOCH (launch day = ...)
 */
export function puzzleNumber(dayKeyStr) {
  // TODO(v1.0): compute whole-day difference between dayKeyStr and LAUNCH_EPOCH
  // (both interpreted as America/Detroit calendar days). Decide whether launch
  // day is #1 or #0 and document it. Guard against pre-launch (clamp to >= 1).
  void dayKeyStr;
  void LAUNCH_EPOCH;
  throw new Error('TODO(v1.0): implement puzzleNumber');
}
