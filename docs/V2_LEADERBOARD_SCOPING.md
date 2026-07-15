# Detroit Dash v2.0 — Global Daily Leaderboard (Scoping)

**Status:** scoping / pre-implementation
**Roadmap:** ROADMAP.md v2.0 (deferred "Option B")
**Breaks the v1 constraint:** v1 is 100% static, no backend. v2 introduces one.

## 1. Goal

A global daily leaderboard: everyone plays the same deterministic daily course,
and the best scores appear on a shared board. Reinforces the daily-habit loop and
the "same for everyone" guarantee, and makes the share card competitive.

## 2. Non-negotiables carried from v1

- **The game keeps working with the backend down.** Leaderboard is additive and
  degrades gracefully (offline → local best/streak still work; board shows
  "unavailable").
- **No accounts, no passwords, no PII.** Anonymous handle only (per the project's
  hard rules). Identity is a self-chosen display name + a client-generated token.
- **One shot per day stays true** — one leaderboard submission per player per day.
- **Determinism stays the source of truth.**

## 3. The central problem: trust

The client computes the score. A naive `POST {score: 999999}` is trivial to
forge. Two models:

### Option A — Replay-verified (recommended)
The client submits the **inputs**, not the score: `{ dayKey, jumpSteps[] }`. The
server re-runs the **same deterministic engine** headless (fixed dt + the day's
seed + the submitted jump steps) and computes the **authoritative score** itself.
The client's claimed score is ignored.

- **Why it fits:** we already built + pinned determinism (keystone test: seed +
  scripted inputs → exact score). The leaderboard is the payoff for that work.
- The engine is DOM-free (`engine/*`, `daily.js`, `scoring.js`), so the Worker
  imports the *same modules* — one source of truth, no drift.
- Payload is tiny: a run has ~10–30 jump events, not thousands of frames.
- Server caps: max steps, max submissions/day/client, reject inputs that don't
  reach the claimed distance.
- **Residual risk:** a bot could brute-force optimal inputs offline. Acceptable
  for a portfolio game; the score is still *achievable*, not fabricated.

### Option B — Trust with limits (simpler)
Client submits `{ dayKey, score, name }`. Server applies a sanity cap, rate limit,
and one-per-day dedup. Cheating is easy but low-stakes (cosmetic board).

- Less code, no server-side engine. But undermines "same for everyone" — anyone
  can post a fake top score.

**Recommendation: Option A.** It's more work but it's the honest version and it's
what the deterministic design was for. Option B is the fallback if we want v2 out
fast.

## 4. Architecture (Cloudflare Worker + KV — roadmap default)

```
Pages (static game)  ──POST /submit {dayKey, jumpSteps, name, clientId}──▶  Worker
        │                                                                     │
        │  ◀──GET /board/{dayKey} → top N {name, score}──────────────────────┘
        │                                                                     │
        └── shares an origin boundary (CORS) ──                         KV namespace
                                                                    board:{dayKey} → entries
                                                                    seen:{dayKey}:{clientId}
```

- **Worker** imports `src/engine/*` for replay (Option A). Stateless.
- **KV**: `board:{dayKey}` holds the sorted top-N; `seen:{dayKey}:{clientId}`
  enforces one-per-day and lets a player improve their own entry only.
- **Free tier** (100k Worker req/day, 100k KV reads / 1k writes) covers a
  portfolio game comfortably.
- **Deploy**: Worker via `wrangler` (separate from Pages); board is read on the
  result screen and rendered under the score.

### Alternative backend: Supabase
Ryan already runs Supabase (estatesync). A `scores` table + a row-level policy +
an Edge Function for replay would also work and reuses familiar tooling. Trade:
a always-on Postgres vs edge KV. CF KV is a better fit for a tiny key/day board;
Supabase is better if we later want richer queries/auth.

## 5. Data model (Option A + KV)

```
board:{dayKey}  →  [{ name, score, clientId }, ...]   // sorted desc, capped top ~100
seen:{dayKey}:{clientId}  →  bestScore                 // dedup + self-improve gate
```
- Names: ≤16 chars, trimmed, basic profanity filter, HTML-escaped on render.
- `clientId`: random uuid persisted in localStorage (`detroit-dash/client`).
- Retention: keep ~30–60 days of boards; KV TTL auto-expires old days.

## 6. API

- `POST /submit` → `{ dayKey, jumpSteps: number[], name, clientId }`
  - validate dayKey == server's current Detroit day (no future/past posting)
  - replay → authoritative score; reject if inputs invalid or over caps
  - if score > seen[clientId]: upsert into board, update seen
  - return the player's rank + the top N
- `GET /board/{dayKey}` → `{ entries: [{name, score}], updatedAt }`
- All JSON; CORS locked to the Pages origin.

## 7. Client changes (game side)

- On result: submit the run's `jumpSteps` (the game already knows them — record
  jump step indices during the run), then fetch + render the board under the
  result card.
- Handle-entry: first submit prompts for a display name (stored locally).
- Graceful offline: board panel shows "leaderboard unavailable", game unaffected.
- Share card can gain a rank line ("Detroit Dash #142 — 1,240 m · rank 37").

## 8. Testing

- Reuse the determinism keystone: server replay of `{seed, jumpSteps}` must equal
  the client's local score — same modules, so equality is guaranteed and testable.
- Worker unit tests: submit validation (bad day, over-cap steps, dup client,
  self-improve only), board sort/cap, rank calc.
- Client: offline degradation, name persistence, one-submit-per-day.

## 9. Rollout

1. Extract engine into a Worker-importable entry (already DOM-free — mostly
   packaging + a `replayScore(dayKey, jumpSteps)` helper).
2. Worker + KV + `/submit` + `/board`; deploy to a `*.workers.dev` (or a
   subdomain).
3. Client: record jumpSteps, submit on result, render board, name entry, offline
   fallback.
4. Ship behind a flag; tag `v2.0.0`.

## 10. Cost / privacy

- Cost: $0 on CF free tier at portfolio scale.
- Privacy: public display names only; no PII; profanity filter; escape on render;
  CORS-locked; no cross-day identity linking beyond the local clientId.

## 11. Decisions (locked 2026-07-15)

1. **Anti-cheat:** ✅ Replay-verified (Option A). Client submits `jumpSteps`; the
   Worker re-runs the engine and is the authoritative scorer.
2. **Backend:** ✅ Cloudflare Worker + KV. Worker imports `src/engine/*` for replay.
3. **Board scope:** ✅ Daily only. One `board:{dayKey}`, rolls over at Detroit
   midnight; old days TTL out.
4. **Name entry:** prompt on first submit, persisted in `detroit-dash/client`
   (name + clientId). (Default — revisit if a settings screen lands.)

## 12. Finalized build plan (v2.0.0)

1. **Engine packaging** — add `src/replay.js`: `replayScore(dayKey, jumpSteps)` →
   builds the seeded world+player+scorer, steps fixed-dt, applies jumps, returns
   the authoritative score. Pure, DOM-free, shared by client + Worker. Unit-test
   it equals the keystone.
2. **Record inputs client-side** — capture `jumpSteps` during a run (push the
   step index on each real jump). Already have the loop + step counter.
3. **Worker** (`worker/`): `POST /submit` (validate day, cap steps, replay,
   dedup + self-improve via `seen:`, upsert `board:`), `GET /board/{dayKey}`
   (top N). CORS locked to the Pages origin. `wrangler.toml` + KV binding.
4. **Client integration** — on result: prompt name (first time), submit, render
   the board panel under the result card, show the player's rank; graceful
   offline fallback. Add a rank line to the share card.
5. **Tests** — Worker validation/sort/rank; client offline + one-per-day;
   replay-equals-local equality.
6. **Deploy + flag** — deploy Worker to `*.workers.dev`; point the client at it;
   ship behind a config flag; tag `v2.0.0`.

**Effort:** larger than any v1.x slice — introduces a deploy target, CORS, and a
second runtime. The engine's existing determinism does the heavy lifting for
trust, so the risk is mostly ops (Worker deploy, KV, secrets) not game logic.
