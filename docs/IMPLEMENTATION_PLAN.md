# Detroit Dash — v1.0 Implementation Plan

A phased, checkbox build plan for v1.0. Governed by `docs/DESIGN.md` (section
numbers below map to that spec). Everything in this repo today is a stub with
`// TODO(v1.0):` markers — except `src/engine/rng.js` (`mulberry32` is real) and
`test/rng.test.mjs` (a passing keystone determinism test).

Build in order. Each phase should end green (`npm test`) before moving on.
No framework, no build step, no dependencies — keep tooling near zero (§8).

---

## Phase 1 — Seeded RNG + determinism foundation (§4, §9)
Governs: §4 (Determinism), §9 (Testing — rng).

- [ ] Confirm `src/engine/rng.js` `mulberry32(seed)` is real and deterministic.
- [ ] `test/rng.test.mjs` passes: same seed → same sequence; different seed → different sequence.
- [ ] Decide the RNG stream API the rest of the engine consumes (e.g. `rng.next()`,
      `rng.range(min, max)`, `rng.int(min, max)`, `rng.pick(arr)`) and implement it on top of `mulberry32`.

## Phase 2 — Day / seed / puzzle number (§4)
Governs: §4 (day key America/Detroit, seed, puzzle number), §6 (`now()` injectable).

- [ ] Implement `dayKey(now)` in `src/daily.js` → `YYYYMMDD` in America/Detroit
      (use `Intl.DateTimeFormat` with `timeZone: 'America/Detroit'`; do not hand-roll DST).
- [ ] Implement `seedFromDay(dayKey)` → 32-bit uint seed for `mulberry32`.
- [ ] Implement `puzzleNumber(dayKey)` → `daysSince(LAUNCH_EPOCH)` (see `src/constants.js`).
- [ ] Set `LAUNCH_EPOCH` in `src/constants.js` to the real launch date (currently provisional `'2026-07-20'`).
- [ ] Tests: `test/determinism.test.mjs` covers day-key rollover at Detroit local midnight,
      stable seed per day, and correct puzzle numbering. All clock reads go through injected `now()`.

## Phase 3 — Game loop + player jump physics + input (§3)
Governs: §3 (Gameplay, feel), §8 (loop/player/input isolation).

- [ ] `src/engine/loop.js` — fixed-timestep `requestAnimationFrame` loop (accumulator; update/render split).
- [ ] `src/engine/player.js` — jump physics, gravity, coyote time, forgiving hitbox (smaller than sprite).
- [ ] `src/engine/input.js` — map tap / Space / ArrowUp / mouse click → a single `jump` action; nothing else in v1.
- [ ] Wire input → player in `src/main.js`. Verify a jump arc feels right on desktop + touch.

## Phase 4 — World spawn from seed + collision (§3, §4, §9)
Governs: §3 (obstacles), §4 (all world-gen from the seeded stream — no `Math.random()`), §9 (world snapshot, collision edges).

- [ ] `src/engine/world.js` — deterministic obstacle spawn (spacing, type, speed-curve breakpoints) drawn only from the seeded RNG.
- [ ] `src/engine/collision.js` — AABB hit / no-hit with forgiving hitbox + coyote-time edges.
- [ ] Tests: same seed → identical spawn list (snapshot); AABB hit/no-hit edge cases.

## Phase 5 — Render + HUD + distance score (§3, §5, §7)
Governs: §3 (scoring = `floor(distance)`), §5 (result screen), §7 (minimal HUD, simple shapes).

- [ ] `src/engine/renderer.js` — canvas draw of player, obstacles, ground; simple shapes / programmer-art.
- [ ] HUD: live score (distance), current streak, puzzle number.
- [ ] Result screen on death: score, distance, personal best, current streak, Share button.

## Phase 6 — Storage / streak + one-shot lock (§6, §9)
Governs: §6 (localStorage schema, streak rules, one-shot lock), §9 (streak tests).

- [ ] `src/storage.js` — single namespaced key `detroit-dash/v1`; read/write schema from §6; injectable `now()`.
- [ ] Streak logic: +1 when `lastPlayedDay` was exactly yesterday; reset to 1 on a gap; unchanged same-day.
- [ ] One-shot lock: if `lastPlayedDay == today`, boot straight to result screen + countdown to next puzzle (no replay).
- [ ] `history` capped to ~60 entries.
- [ ] Tests: `test/streak.test.mjs` — consecutive → +1; gap → reset; same-day → unchanged (injected `now()`).

## Phase 7 — Share card (§5)
Governs: §5 (spoiler-free share text).

- [ ] `src/shareCard.js` — build clipboard text: `Detroit Dash #N` / `<distance> m · 🔥 <n>-day streak` / `<play url>`.
- [ ] Never reveal the course. Wire the result-screen Share button to clipboard.

## Phase 8 — Deploy verify + manual pass (§9, §10)
Governs: §9 (manual testing), §10 (hosting).

- [ ] Confirm GitHub Pages serves from `main` root; game loads at https://ryankolean.github.io/detroit-dash/.
- [ ] Manual: touch @375 (no horizontal scroll), keyboard on desktop, one-shot lock + countdown after a run.
- [ ] `npm test` green. Tag `v1.0.0`, add a short CHANGELOG entry, push to `main`.

---

## Keystone tests (must exist and pass before v1.0 is "done")
- **rng determinism** — `test/rng.test.mjs` (Phase 1, done).
- **daily determinism** — `test/determinism.test.mjs`: fixed seed + scripted input timeline → exact final score. Proves "same for everyone" (§4, §9).
- **streak** — `test/streak.test.mjs`: consecutive / gap / same-day via injected `now()` (§6, §9).
