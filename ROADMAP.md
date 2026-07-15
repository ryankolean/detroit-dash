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

## v1.3
- [ ] Photo-accurate pixel-art Detroit skyline, day/night variant by local time
- [ ] Stats / history screen
- [ ] Result-card polish
- [ ] Accessibility pass

## v1.4 — Detroit flavor
- [ ] Sprites of notable Detroit icons (Renaissance Center, Spirit of Detroit,
      Guardian Building, Joe Louis fist, Fox Theatre) as obstacles/collectibles

## v2.0
- [ ] Global daily leaderboard (backend — Cloudflare Worker + KV; deferred Option B)

## v3.0
- [ ] Daily-seed roguelite variant (Option C; calendar reminder 2026-07-20)
