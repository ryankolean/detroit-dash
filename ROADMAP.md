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

## v3.0 — daily-seed roguelite ✓
- [x] Deterministic roguelite: escalating segments + choice gates + power-ups,
      all input-driven and replay-safe (leaderboard intact)
- [x] Power-ups: shield, coin-magnet, slow-mo, 2x coin window
- [x] One-button choice gates (auto-cycle, tap to pick) every 300 m
- [x] Shared `engine/session.js` — live game + Worker replay run identical sim
- [x] Fair pacing: slow difficulty ramp; obstacle gaps grow with speed so
      reaction time stays constant (never crowded)

## v3.1 — fairness + fun ✓
- [x] Balance: shield capped at 2 (no invincibility hoarding — was unbounded)
- [x] Cosmetic-only skins (Classic, Motor City, Vernors, Gold, Midnight),
      unlocked by play; picker in the stats overlay; zero board impact
- [x] Difficulty playtest: gentle ramp confirmed (250→540 over ~950 m), gaps
      grow with speed so obstacles never crowd
- [x] Cosmetic trails (Spark, Ribbon, Ember) — colored by skin, unlocked by play,
      picker in the stats overlay
- [ ] (later) More skins + trail styles

## v3.2 — extra plays (ad / social share)
- [ ] Earn additional plays by watching a rewarded ad or performing a social share
- [ ] **Ranked integrity is non-negotiable:** only the first (one-shot) run of the
      day submits to the daily leaderboard. Extra plays are **unranked practice** —
      same daily course, but they never post a score. Preserves "one shot, same
      for everyone" + the replay-verified board.
- [ ] Practice runs surface the score + how it *would* rank, clearly labeled
      "practice — not submitted", with a fresh best-practice-of-day tracker.
- [ ] Ad path: a rewarded-video provider (e.g. an AdSense/AdMob-style SDK or a
      lightweight house-ad), gated behind a config flag; degrade gracefully to
      share-only if no ad is configured (keeps the site static/backendless).
- [ ] Share path: grant one extra play after the spoiler-free share card is
      copied/shared; cap extra plays/day to avoid a grind loop.
- [ ] Cap total plays/day and persist the counter in localStorage; the one-shot
      lock still governs the *ranked* run only.

## v3.3 — contrast + readability pass ✓
- [x] Player visibility: play-lane scrim (dark gradient behind the action) +
      per-theme contact shadow + dark outline on the runner, so it pops against
      the skyline in both day and night, across all skins.
- [x] Menu/UI contrast: fixed the day-theme dark-`--fg`-on-dark-card bug (overlay
      cards now force light text); stronger overlay + choice-gate scrims; raised
      muted-text opacities. Verified WCAG AA+ (result-card ratios 9.6–14.4:1).
- [x] Verified via a contrast checker at desktop in day + night; no console errors.
