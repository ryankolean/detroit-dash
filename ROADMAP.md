# Detroit Dash — Release Roadmap

Derived from the design spec (`docs/DESIGN.md`, §11). Ship a very basic, correct
v1.0 first, then improve through versioned releases. Do not gold-plate v1.

Each release: tag (`v1.0.0`…), a short CHANGELOG entry, push to `main`
(auto-serves via GitHub Pages).

## v1.0 — very basic, ship first
- [ ] Standalone repo + GitHub Pages
- [ ] One-button jump
- [ ] Auto-run (world scrolls, speed ramps with distance)
- [ ] Deterministic daily seed (America/Detroit day key + `mulberry32`)
- [ ] One-shot per day (localStorage lock + countdown)
- [ ] Distance score (`floor(distance)`)
- [ ] localStorage best + streak
- [ ] Text share card (spoiler-free)
- [ ] Simple-shape / programmer-art visuals
- [ ] `node --test` determinism + streak tests

## v1.1
- [ ] Collectibles + combo scoring
- [ ] Share-card score-tier glyph bar

## v1.2
- [ ] Real pixel-art sprite sheet
- [ ] Detroit parallax skyline
- [ ] Particle FX
- [ ] Sound (with mute toggle)

## v1.3
- [ ] Stats / history screen
- [ ] Result-card polish
- [ ] Accessibility pass

## v2.0
- [ ] Global daily leaderboard (backend — Cloudflare Worker + KV; deferred Option B)

## v3.0
- [ ] Daily-seed roguelite variant (Option C; calendar reminder 2026-07-20)
