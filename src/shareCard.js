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
  // TODO(v1.0): format distance with thousands separators (e.g. toLocaleString),
  // assemble the three lines exactly as above, append PLAY_URL. No course detail.
  void result;
  void PLAY_URL;
  throw new Error('TODO(v1.0): implement buildShareText');
}

/**
 * copyShareText — write share text to the clipboard.
 * @param {string} text
 * @returns {Promise<void>}
 */
export function copyShareText(text) {
  // TODO(v1.0): navigator.clipboard.writeText(text) with a fallback for older
  // mobile browsers (hidden textarea + document.execCommand('copy')).
  void text;
  throw new Error('TODO(v1.0): implement copyShareText');
}
