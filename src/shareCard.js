// Spoiler-free share card text (§5). Pure string building, no DOM.
// Never reveal the course — no obstacle layout, no screenshot.

import { PLAY_URL } from './constants.js';

/**
 * buildShareText — the clipboard text for the Share button (§5). Shape:
 *
 *   Detroit Dash #142
 *   1,240 m · 🔥 7-day streak
 *   <play url>
 *
 * @param {{ puzzleNumber: number, distance: number, streak: number }} result
 * @returns {string}
 */
export function buildShareText(result) {
  const dist = Math.floor(result.distance).toLocaleString('en-US');
  return [
    `Detroit Dash #${result.puzzleNumber}`,
    `${dist} m · 🔥 ${result.streak}-day streak`,
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
