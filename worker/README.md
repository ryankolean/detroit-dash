# Detroit Dash — Leaderboard Worker

Replay-verified global daily leaderboard (v2.0). The client submits its jump-step
timeline; this Worker re-runs the same deterministic engine (`../src/replay.js`)
and is the sole authority on the score. See `../docs/V2_LEADERBOARD_SCOPING.md`.

## Deploy (one-time)

Requires a Cloudflare account + `wrangler` (`npm i -g wrangler`).

```sh
cd worker
wrangler login

# 1. Create the KV namespace, then paste the printed id into wrangler.toml
wrangler kv namespace create BOARD

# 2. (optional) confirm ALLOWED_ORIGIN in wrangler.toml matches the Pages URL
#    default: https://ryankolean.github.io

# 3. Deploy
wrangler deploy
```

`wrangler deploy` prints the Worker URL (e.g. `https://detroit-dash-board.<you>.workers.dev`).

## Wire the client

Set the Worker URL in `../src/constants.js`:

```js
export const BACKEND_URL = 'https://detroit-dash-board.<you>.workers.dev';
```

Empty string (default) disables the leaderboard entirely — the game stays fully
playable with no backend.

## Routes

- `GET /board/YYYYMMDD` → `{ day, entries: [{ name, score }] }` (top 25)
- `POST /submit` → body `{ dayKey, jumpSteps, name, clientId }` →
  `{ day, score, best, rank, entries }`. Rejects: non-today day (409), bad
  inputs / client / json (400).

## Notes

- **Trust:** only `dayKey` + `jumpSteps` are trusted; the score is recomputed.
  A forged score is impossible; a bot could still brute-force good inputs
  offline (acceptable for a portfolio board).
- **Storage:** `board:{day}` (sorted top 100) + `seen:{day}:{clientId}` (dedup /
  self-improve), both TTL ~60 days.
- **Concurrency:** board writes are read-modify-write on KV (not transactional).
  At portfolio traffic, collisions are negligible; a Durable Object would make it
  strictly correct if ever needed.
- **Local test:** `wrangler dev` serves it at `http://localhost:8787`.
