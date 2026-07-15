// Leaderboard helpers (v2.0). Pure, shared by the client and the Cloudflare
// Worker so validation + board math have a single source of truth. No DOM, no
// network. The Worker is the authoritative scorer (it replays inputs); these
// helpers only validate shape and maintain the sorted board.

export const MAX_NAME = 16;
export const BOARD_LIMIT = 100; // entries kept in KV per day
export const BOARD_TOP_N = 25; // entries returned to the client
export const MAX_JUMP_STEPS = 5000; // a run can't sanely have more jumps than this

// Minimal profanity guard — names that contain these become "Runner". Kept small
// on purpose; the board is low-stakes and names are HTML-escaped on render too.
const BANNED = ['fuck', 'shit', 'cunt', 'nigger', 'faggot'];

/**
 * sanitizeName — clamp + clean a display name. Never throws; always returns a
 * non-empty safe string.
 * @param {unknown} raw
 * @returns {string}
 */
export function sanitizeName(raw) {
  let n = String(raw ?? '').replace(/[<>&"'\\]/g, '').trim().slice(0, MAX_NAME);
  if (!n) return 'Runner';
  const low = n.toLowerCase();
  if (BANNED.some((b) => low.includes(b))) return 'Runner';
  return n;
}

/**
 * validateJumpSteps — a submitted input timeline must be a strictly ascending
 * array of unique non-negative integers within [0, maxSteps), and not oversized.
 * @param {unknown} steps
 * @param {number} maxSteps
 * @returns {boolean}
 */
export function validateJumpSteps(steps, maxSteps) {
  if (!Array.isArray(steps) || steps.length > MAX_JUMP_STEPS) return false;
  let prev = -1;
  for (const s of steps) {
    if (!Number.isInteger(s) || s < 0 || s >= maxSteps) return false;
    if (s <= prev) return false; // strictly ascending -> also enforces uniqueness
    prev = s;
  }
  return true;
}

/**
 * upsertScore — insert/replace a client's entry and return the sorted, capped
 * board. One entry per clientId; higher score wins.
 * @param {Array<{name:string,score:number,clientId:string}>} board
 * @param {{name:string,score:number,clientId:string}} entry
 * @param {number} [limit]
 * @returns {Array}
 */
export function upsertScore(board, entry, limit = BOARD_LIMIT) {
  const next = (Array.isArray(board) ? board : []).filter((e) => e.clientId !== entry.clientId);
  next.push(entry);
  next.sort((a, b) => b.score - a.score);
  return next.slice(0, limit);
}

/**
 * rankOf — 1-based rank of a client in a sorted board, or null if absent.
 * @param {Array<{clientId:string}>} board
 * @param {string} clientId
 * @returns {number|null}
 */
export function rankOf(board, clientId) {
  const i = (Array.isArray(board) ? board : []).findIndex((e) => e.clientId === clientId);
  return i >= 0 ? i + 1 : null;
}

/**
 * publicBoard — strip clientId, return the top N {name, score} for the client.
 * @param {Array<{name:string,score:number}>} board
 * @param {number} [topN]
 * @returns {Array<{name:string,score:number}>}
 */
export function publicBoard(board, topN = BOARD_TOP_N) {
  return (Array.isArray(board) ? board : [])
    .slice(0, topN)
    .map((e) => ({ name: e.name, score: e.score }));
}
