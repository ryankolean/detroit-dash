// Detroit Dash — global daily leaderboard Worker (v2.0).
// Replay-verified: the client submits its jump-step timeline, never a score. The
// Worker re-runs the same deterministic engine (src/replay.js) and is the sole
// authority on the score. Backed by a KV namespace bound as `BOARD`.
//
// Routes:
//   GET  /board/:YYYYMMDD  -> { day, entries: [{name, score}] }
//   POST /submit           -> { dayKey, jumpSteps, name, clientId }
//                             replays, dedups per client (higher wins), returns
//                             { day, score, best, rank, entries }
//
// Env: BOARD (KV binding), ALLOWED_ORIGIN (CORS origin; "*" if unset).

import { dayKey } from '../src/daily.js';
import { replayScore, MAX_STEPS } from '../src/replay.js';
import {
  validateJumpSteps,
  sanitizeName,
  upsertScore,
  rankOf,
  publicBoard,
  BOARD_LIMIT,
} from '../src/leaderboard.js';

const DAY_TTL = 60 * 24 * 3600; // keep each day's board ~60 days, then auto-expire

function corsHeaders(origin, allowed) {
  // Echo the request origin when it matches the allow-list; otherwise send the
  // configured origin (locks the board to the game's site).
  const allowOrigin = allowed === '*' ? '*' : origin === allowed ? origin : allowed;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || '*';
    const origin = request.headers.get('Origin') || '';
    const ch = corsHeaders(origin, allowed);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: ch });

    const url = new URL(request.url);

    // --- GET /board/:day ---
    const boardMatch = url.pathname.match(/^\/board\/(\d{8})$/);
    if (request.method === 'GET' && boardMatch) {
      const day = boardMatch[1];
      const board = (await env.BOARD.get(`board:${day}`, 'json')) || [];
      return json({ day, entries: publicBoard(board) }, 200, ch);
    }

    // --- POST /submit ---
    if (request.method === 'POST' && url.pathname === '/submit') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'bad json' }, 400, ch);
      }
      const { dayKey: day, jumpSteps, name, clientId } = body || {};

      if (typeof day !== 'string' || !/^\d{8}$/.test(day)) {
        return json({ error: 'bad day' }, 400, ch);
      }
      // Only today's puzzle may be submitted — no back- or future-dating.
      if (day !== dayKey(new Date())) return json({ error: 'not today' }, 409, ch);
      if (typeof clientId !== 'string' || clientId.length < 8 || clientId.length > 64) {
        return json({ error: 'bad client' }, 400, ch);
      }
      if (!validateJumpSteps(jumpSteps, MAX_STEPS)) {
        return json({ error: 'bad inputs' }, 400, ch);
      }

      // Authoritative score — the client's claim is never trusted.
      const { score } = replayScore(day, jumpSteps);
      const cleanName = sanitizeName(name);

      const seenKey = `seen:${day}:${clientId}`;
      const prevBest = (await env.BOARD.get(seenKey, 'json')) || 0;

      let board = (await env.BOARD.get(`board:${day}`, 'json')) || [];
      if (score > prevBest) {
        board = upsertScore(board, { name: cleanName, score, clientId }, BOARD_LIMIT);
        await env.BOARD.put(`board:${day}`, JSON.stringify(board), { expirationTtl: DAY_TTL });
        await env.BOARD.put(seenKey, JSON.stringify(score), { expirationTtl: DAY_TTL });
      }

      return json(
        {
          day,
          score,
          best: Math.max(prevBest, score),
          rank: rankOf(board, clientId),
          entries: publicBoard(board),
        },
        200,
        ch,
      );
    }

    return json({ error: 'not found' }, 404, ch);
  },
};
