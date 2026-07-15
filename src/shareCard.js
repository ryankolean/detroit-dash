// Spoiler-free share card text (§5). Pure string building, no DOM.
// Never reveal the course — no obstacle layout, no screenshot.

import { PLAY_URL } from './constants.js';

// Score thresholds a run must reach to light each glyph, low -> high. A run
// lights one glyph per threshold it clears; the bar has SLOTS glyphs total.
const TIER_THRESHOLDS = [1, 500, 1000, 2000, 4000];
const TIER_SLOTS = TIER_THRESHOLDS.length;

/**
 * scoreTierBar — spoiler-free score-tier glyph bar (v1.1). Reveals only rough
 * score magnitude, never the course. E.g. 1200 -> "🟧🟧🟧⬛⬛".
 * @param {number} score
 * @returns {string}
 */
export function scoreTierBar(score) {
  const filled = TIER_THRESHOLDS.filter((t) => score >= t).length;
  return '🟧'.repeat(filled) + '⬛'.repeat(TIER_SLOTS - filled);
}

/**
 * buildShareText — the clipboard text for the Share button (§5, glyph bar v1.1):
 *
 *   Detroit Dash #142
 *   1,240 m · 🔥 7-day streak
 *   🟧🟧🟧⬛⬛
 *   <play url>
 *
 * @param {{ puzzleNumber: number, distance: number, streak: number }} result
 *        `distance` is the final score (distance + coins).
 * @returns {string}
 */
export function buildShareText(result) {
  const score = Math.floor(result.distance);
  const dist = score.toLocaleString('en-US');
  return [
    `Detroit Dash #${result.puzzleNumber}`,
    `${dist} m · 🔥 ${result.streak}-day streak`,
    scoreTierBar(score),
    PLAY_URL,
  ].join('\n');
}

/**
 * copyShareText — write share text to the clipboard.
 * @param {string} text
 * @returns {Promise<void>}
 */
export function copyShareText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older mobile browsers without the async clipboard API.
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}
