# Detroit Dash — Design Spec

**Date:** 2026-07-15
**Project:** Summit Software Solutions — portfolio game (standalone)
**Status:** Approved design, pre-implementation
**Hosting:** its OWN new GitHub repository + GitHub Pages (NOT inside the marketing site)

> Name: **Detroit Dash** · repo **`detroit-dash`** (confirmed 2026-07-15).
> This design doc lives in the marketing repo as the project record; the game itself ships from a separate repo (§8, §10).

## 1. Purpose

A standalone browser game, hosted on its own GitHub Pages URL, that (a) demonstrates real front-end engineering (real-time canvas rendering, deterministic simulation, input handling, testable game logic) and (b) is *habitually* engaging — designed so people return every day. The daily-habit loop doubles as marketing: the shareable result card puts "Summit" in social feeds. The Summit portfolio site links out to it.

**Ship philosophy:** a **very basic first iteration (v1.0)** that is fully playable and correct, then improve it through versioned releases over time (§11). Do not gold-plate v1.

Success criteria (v1.0):
- A first-time visitor plays within 5 seconds (one input, no tutorial).
- A returning visitor has a reason to come back tomorrow (new daily course + streak at stake).
- Works on phone (touch) and desktop (keyboard).
- 100% static, no backend, served from GitHub Pages.
- Game logic deterministic and unit-testable headless.

## 2. Model (decided)

- **Daily puzzle (Wordle model):** ONE course per day, identical for everyone, hard stop until the next day.
- **Core mechanic:** one-button endless-runner *dodge* (Chrome-dino lineage).
- **Attempts:** ONE shot per day, one life.
- **Persistence/social:** no backend. `localStorage` streak + best; competition via a spoiler-free shareable result card.

## 3. Gameplay (v1.0)

- **Auto-run:** player runs left→right automatically; world scrolls; speed ramps with distance.
- **Input:** a SINGLE action = **jump**. Bound to tap (touch), Space, ArrowUp, mouse click. Nothing else in v1.
- **Obstacles:** ground obstacles, all clearable with a timed jump. Timing is the whole skill. (Detroit theming of the obstacle *art* is a later iteration; v1 can use simple shapes.)
- **End condition:** one collision ends the run. Runs ~30–90s.
- **Feel:** forgiving hitbox (slightly smaller than sprite), coyote-time on jump.
- **Scoring (v1.0):** score = `floor(distance)`. (Collectibles/combo are v1.1 — see §11.)

## 4. Determinism (the "same for everyone" guarantee)

- **Day key:** `YYYYMMDD` in **America/Detroit** so the puzzle rolls over at a consistent local midnight for all players.
- **Seeded PRNG:** `mulberry32` seeded from the day key. ALL world generation (obstacle spacing, type, speed-curve breakpoints) draws from this one seeded stream. No `Math.random()` in world generation.
- **Puzzle number:** `daysSince(LAUNCH_EPOCH)`, shown as "Daily Dash #N".
- **Guarantee:** same day → identical course + scoring for everyone. Makes scores comparable, the share card meaningful, and the engine unit-testable (seed + scripted inputs → deterministic score).

## 5. Scoring & share card

- **Result screen** (on death): score, distance, personal best, current streak, **Share** button.
- **Share card** (clipboard text, spoiler-free — never reveals the course):
  ```
  Detroit Dash #142
  1,240 m · 🔥 7-day streak
  <play url>
  ```
  No screenshots, no obstacle reveal. (A score-tier glyph bar is a v1.x polish item.)

## 6. Persistence (localStorage)

Single namespaced key `detroit-dash/v1`:
```json
{
  "lastPlayedDay": "20260715",
  "currentStreak": 7,
  "maxStreak": 12,
  "bestScore": 1830,
  "history": [{ "day": "20260715", "score": 1240 }]
}
```
- **Streak:** +1 when `lastPlayedDay` was exactly yesterday; resets to 1 on a gap; unchanged same-day.
- **One-shot lock:** if `lastPlayedDay == today`, boot straight to the result screen + countdown to the next puzzle. No replay of today's course.
- `history` capped (last ~60). All clock reads go through one injectable `now()` for testability.

## 7. Visual & audio (v1.0 minimal)

- **v1.0:** simple, clean shapes/programmer-art. Minimal HUD (score, streak, puzzle #). No sound, no parallax, no particles yet — those are later iterations (§11).
- **Brand:** even in v1, use Summit-ish colors/type where trivial (a web font + palette), but do not block v1 on art.

## 8. Architecture — standalone, static, no framework

**New standalone repo.** Plain static site: `index.html` + vanilla JS **ES modules** + `<canvas>`. **No framework, no build step** (keeps v1 "very basic" and GitHub-Pages-trivial). Engine is pure JS and runs headless for tests.

```
detroit-dash/            <- NEW GitHub repo (root = the site)
  index.html                  canvas + minimal HUD markup + module entry
  style.css
  src/
    main.js                   bootstrap: mount canvas, wire HUD, run loop or show lock screen
    engine/
      loop.js                 requestAnimationFrame fixed-timestep loop
      rng.js                  mulberry32 seeded PRNG
      world.js                deterministic obstacle spawn from seed
      player.js               jump physics, coyote time, hitbox
      collision.js            AABB checks
      renderer.js             canvas draw
      input.js                tap/space/arrow/click -> jump
    daily.js                  day key (America/Detroit), seed, puzzle number
    storage.js                localStorage + streak logic (injectable now())
    shareCard.js              spoiler-free share text
    constants.js              LAUNCH_EPOCH, tuning
  test/
    determinism.test.mjs      keystone: fixed seed + scripted inputs -> known score
    streak.test.mjs           consecutive/gap/same-day via injected now()
  README.md
  LICENSE
```
- **No React.** (The marketing site stays separate; it only links to this game's URL.)
- **Isolation:** `engine/*` pure JS, DOM only in `renderer`/`input`; `daily.js`/`storage.js` take injected `now()`. Tests run headless via `node --test` (no test framework dependency), keeping tooling near-zero.

## 9. Testing (v1.0)

- **rng:** same seed → same sequence; different day → different sequence.
- **world:** same seed → identical spawn list (snapshot).
- **collision:** AABB hit/no-hit edges (coyote time, forgiving hitbox).
- **scoring:** distance math.
- **streak:** consecutive → +1; gap → reset; same-day → unchanged (injected `now()`).
- **keystone (determinism):** fixed seed + scripted input timeline → assert exact final score. Proves "same for everyone."
- Run via `node --test` — no framework, no build.
- **manual:** touch @375 (no horizontal scroll), keyboard desktop, one-shot lock + countdown.

## 10. Repository, hosting & embed

**Implementation step 1 = create the repo:**
- `gh repo create ryankolean/detroit-dash --public --description "Detroit Dash — daily one-shot dodge-runner, a Summit portfolio game" --clone`.
- Copy this design doc into the new repo under `docs/`.
- **GitHub Pages:** serve from the `main` branch root (Settings → Pages → Deploy from branch → `main` / root). No build step means the repo root IS the site. Live at `https://ryankolean.github.io/detroit-dash/`.
- Add a simple deploy note to README; no Actions workflow needed for a no-build static site (Pages serves the branch directly). A GitHub Actions Pages workflow is optional and can come in a later iteration if a build step is ever added.

**Portfolio embed (separate, small change to the marketing repo, later):**
- Add a "Play the Daily" card/CTA in the Summit site's work/portfolio section linking to the game's Pages URL (open in a new tab; optional iframe embed later).
- This marketing-site change is NOT part of the game repo and is done after v1.0 is live.

## 11. Release roadmap (iterate over time)

- **v1.0 (very basic, ship first):** standalone repo + Pages; one-button jump; auto-run; deterministic daily seed; one-shot; distance score; localStorage best + streak; text share card; simple-shape art; `node --test` determinism + streak tests.
- **v1.1:** collectibles + combo scoring; share-card score-tier glyph bar.
- **v1.2:** real pixel-art sprite sheet + Detroit parallax skyline + particle FX + sound (with mute toggle).
- **v1.3:** stats/history screen; result-card polish; accessibility pass.
- **v2.0:** global daily leaderboard (backend — Cloudflare Worker + KV; the deferred Option B).
- **v3.0:** daily-seed roguelite variant (Option C; calendar reminder 2026-07-20).

Each release: tag (`v1.0.0`…), short CHANGELOG entry, push to `main` (auto-serves via Pages).

## 12. Open items

- Set `LAUNCH_EPOCH` date at repo creation.
- Sprite art deferred to v1.2; v1.0 ships with simple shapes.
- Global leaderboard (v2) and roguelite (v3) get their own specs when reached.
