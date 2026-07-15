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
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}${get('month')}${get('day')}`;
}

/**
 * isDaytime — true when it is daytime (07:00–18:59) in America/Detroit (v1.3).
 * Selects the day vs night skyline variant. Pure, uses injected `now`.
 *
 * @param {Date} now - injected clock (defaults to new Date()).
 * @returns {boolean}
 */
export function isDaytime(now = new Date()) {
  const hour = +new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now).find((p) => p.type === 'hour').value;
  return hour >= 7 && hour < 19;
}

/**
 * seedFromDay — deterministic 32-bit uint seed derived from a day key (§4).
 * Feeds mulberry32. Same day key -> same seed -> identical course.
 *
 * @param {string} dayKeyStr - e.g. "20260715"
 * @returns {number} 32-bit unsigned integer
 */
export function seedFromDay(dayKeyStr) {
  // FNV-1a 32-bit hash — scatters adjacent day keys into unrelated seeds.
  let h = 0x811c9dc5;
  for (let i = 0; i < dayKeyStr.length; i++) {
    h ^= dayKeyStr.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * puzzleNumber — "Detroit Dash #N", where N = daysSince(LAUNCH_EPOCH) (§4).
 *
 * @param {string} dayKeyStr - e.g. "20260715"
 * @returns {number} whole number of days since LAUNCH_EPOCH (launch day = ...)
 */
export function puzzleNumber(dayKeyStr) {
  // Launch day is #1. Both dates are Detroit calendar days; diff the plain
  // Y/M/D via UTC-midnight epochs so no timezone/DST math enters — a calendar
  // day is a calendar day regardless of offset.
  const utc = (y, m, d) => Date.UTC(y, m - 1, d);
  const key = utc(
    +dayKeyStr.slice(0, 4),
    +dayKeyStr.slice(4, 6),
    +dayKeyStr.slice(6, 8),
  );
  const [ly, lm, ld] = LAUNCH_EPOCH.split('-').map(Number);
  const launch = utc(ly, lm, ld);
  const days = Math.round((key - launch) / 86400000);
  return Math.max(1, days + 1);
}
