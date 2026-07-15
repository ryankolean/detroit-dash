# Detroit Dash

A daily one-shot dodge-runner. Every day there's **one** course, identical for
everyone, and you get **one** run at it. One button: jump. The world auto-scrolls
and speeds up with distance; time your jumps to clear obstacles; a single
collision ends the run. Your score is the distance you covered. Come back
tomorrow for a new course and to keep your streak alive. A Summit Software
Solutions portfolio game — 100% static, no backend, deterministic and testable.

## How to play

- **One action: jump.** Tap the screen (touch), or press **Space** / **↑**, or click.
- Clear ground obstacles with a timed jump. One hit ends the run.
- One shot per day. After your run you see your score, best, streak, and a
  spoiler-free share card, plus a countdown to the next daily.

## Run locally

No build step, no dependencies. Serve the folder with any static server:

```sh
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000/
```

Or just open `index.html` in a browser (ES modules load fine over `file://` in
most browsers; use the server above if yours blocks module scripts).

Run the tests (headless, no framework — Node's built-in test runner):

```sh
npm test   # node --test
```

## Deploy

GitHub Pages, **Deploy from branch → `main` / root**. No build step means the
repo root *is* the site (`.nojekyll` tells Pages to serve files as-is). Push to
`main` and Pages redeploys.

Live at **https://ryankolean.github.io/detroit-dash/**

## Start here (next session)

This repo is a seeded scaffold — the game logic is **not** implemented yet.
Every module is a stub with `// TODO(v1.0):` markers describing what it must do.
The only real code is `src/engine/rng.js` (`mulberry32`) and its passing test.

To build v1.0:

1. Read **[`docs/DESIGN.md`](docs/DESIGN.md)** — the full approved design spec
   (source of truth).
2. Follow **[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md)** —
   a phased, checkbox build plan (Phase 1 → 8), each phase mapped to spec sections.
3. Begin with **Phase 1** (seeded RNG + determinism), then work down the phases,
   keeping `npm test` green.

See **[`ROADMAP.md`](ROADMAP.md)** for the release plan (v1.0 → v3.0).

> Note: `LAUNCH_EPOCH` in `src/constants.js` is **provisional** (`2026-07-20`).
> Confirm the real launch date before v1.0 ships — it defines the "Detroit Dash #N"
> puzzle number.

## Structure

```
detroit-dash/
  index.html            canvas + minimal HUD + module entry
  style.css
  src/
    main.js             bootstrap: puzzle identity, play-vs-locked, loop
    engine/
      loop.js           fixed-timestep rAF loop
      rng.js            mulberry32 seeded PRNG (implemented)
      world.js          deterministic obstacle spawn from seed
      player.js         jump physics, coyote time, hitbox
      collision.js      AABB checks
      renderer.js       canvas draw
      input.js          tap/space/arrow/click -> jump
    daily.js            day key (America/Detroit), seed, puzzle number
    storage.js          localStorage + streak logic (injectable now())
    shareCard.js        spoiler-free share text
    constants.js        LAUNCH_EPOCH, tuning
  test/
    rng.test.mjs        keystone rng determinism (passing)
    determinism.test.mjs seed + scripted inputs -> known score (skeleton)
    streak.test.mjs     consecutive/gap/same-day (skeleton)
  docs/
    DESIGN.md           full design spec (source of truth)
    IMPLEMENTATION_PLAN.md  phased v1.0 build plan
  ROADMAP.md            release roadmap v1.0 -> v3.0
```

## License

MIT © 2026 Ryan Kolean / Summit Software Solutions LLC. See [`LICENSE`](LICENSE).
