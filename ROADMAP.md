# Detroit Dash — Release Roadmap

Derived from the design spec (`docs/DESIGN.md`, §11). Ship a very basic, correct
v1.0 first, then improve through versioned releases. Do not gold-plate v1.

Each release: tag (`v1.0.0`…), a short CHANGELOG entry, push to `main`
(auto-serves via GitHub Pages).

## v1.0 — very basic, ship first ✓
- [x] Standalone repo + GitHub Pages
- [x] One-button jump
- [x] Auto-run (world scrolls, speed ramps with distance)
- [x] Deterministic daily seed (America/Detroit day key + `mulberry32`)
- [x] One-shot per day (localStorage lock + countdown)
- [x] Distance score (`floor(distance)`)
- [x] localStorage best + streak
- [x] Text share card (spoiler-free)
- [x] Simple-shape / programmer-art visuals
- [x] `node --test` determinism + streak tests

## v1.1 ✓
- [x] Collectibles + streak-combo scoring
- [x] Share-card score-tier glyph bar

## v1.2 ✓
- [x] Canvas-drawn sprites (animated runner + themed obstacles)
- [x] Detroit parallax skyline
- [x] Particle FX
- [x] Sound (with mute toggle)

## v1.3 ✓
- [x] Photo-accurate pixel-art Detroit skyline, day/night variant by local time
- [x] Stats / history screen (games, best, average, streaks, recent runs)
- [x] Result-card polish (new-best badge, run breakdown, max combo)
- [x] Accessibility pass (dialog roles, focus management, Esc, focus-visible,
      reduced-motion)

## v1.4 — Detroit flavor ✓
- [x] Detroit-hazard obstacle sprites (Michigan orange barrel, People Mover
      pillar, factory smokestack)
- [x] Detroit-icon bonus collectibles (Joe Louis fist, Spirit of Detroit,
      Guardian Building) — worth a bonus, advance the combo

## v2.0 — global daily leaderboard ✓ (code; deploy pending)
- [x] Replay-verified scoring (client submits inputs; Worker recomputes score)
- [x] Cloudflare Worker + KV (`worker/`), daily board, dedup + self-improve
- [x] Client: record inputs, submit, render board + rank, offline fallback
- [x] Ships disabled (`BACKEND_URL=''`); set it after `wrangler deploy` to enable
      (see `worker/README.md`)

## v3.0
- [ ] Daily-seed roguelite variant (Option C; calendar reminder 2026-07-20)
