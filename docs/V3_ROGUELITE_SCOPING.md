# Detroit Dash v3.0 — Daily-Seed Roguelite Variant (Scoping)

**Status:** scoping / pre-implementation
**Roadmap:** ROADMAP.md v3.0 ("Option C"; original calendar reminder 2026-07-20)

## 1. The central tension

A roguelite means **runs + choices + upgrades + escalation + build variety**.
Detroit Dash's DNA is the opposite: **one deterministic course, one shot per day,
identical for everyone, comparable via a replay-verified leaderboard.**

The whole design problem is adding roguelite depth **without** breaking:
determinism, "same for everyone", one-shot fairness, and replay-verified scoring.

Good news: the engine is already input-driven and deterministic. A *choice* is
just another input the replay engine can consume. So depth can be added as
**player choices over a deterministic option set** — the course (and the options
offered) stay the same for everyone; outcomes diverge by skill + decisions, and
the leaderboard stays honest because the Worker replays the choices too.

## 2. Models

### Option A — Deterministic daily roguelite (recommended)
Keep one shot / one daily seed / same for everyone. Add roguelite structure that
is fully deterministic and input-driven:

- **Escalating segments ("blocks").** The single run is divided into rising-
  difficulty segments (faster scroll, denser hazards, new patterns). Clearing a
  segment is the run's progression — deeper = higher score ceiling.
- **Choice gates.** At deterministic points the run offers N power-ups (drawn
  from the seed, so everyone sees the same menu); the player picks one — that
  pick is an **input**, recorded like a jump. No divergence in what's offered,
  only in what's chosen.
- **Power-ups (deterministic effects).** e.g. shield (survive one hit),
  coin-magnet, brief slow-mo, double-jump, score multiplier window. All effects
  are pure sim — no `Math.random`.
- **Replay-safe.** The submitted input timeline becomes `{ jumps[], choices[] }`;
  the Worker replays both and stays the authoritative scorer. Leaderboard
  fairness is preserved — everyone had the same seed, same option menus.

Fits the existing architecture with the least new machinery. **Recommended.**

### Option B — Separate endless roguelite mode
A distinct mode beside the daily one-shot: unlimited runs, seed-per-run RNG,
persistent meta-progression (currency, unlocks), true build variety, escalating
floors. Richer roguelite, but it abandons the daily fairness model and needs its
own (or no) leaderboard. Effectively a second game.

### Option C — Weekly gauntlet
A longer deterministic run spanning a week with checkpoints and intra-season
meta. Middle ground; more product/design than the daily loop needs right now.

## 3. Meta-progression — the second fairness fork

Roguelites usually persist unlocks between runs. That collides with "same for
everyone":

- **Cosmetic-only (fairness-safe, recommended).** Unlock skins, trails, board
  flair via play. No gameplay advantage → the leaderboard stays pure.
- **Gameplay unlocks (richer, needs isolation).** Starting loadouts / perks that
  change the run. Then the daily leaderboard is no longer apples-to-apples —
  would need a separate/unranked board, or per-loadout boards. Only viable under
  Option B, or a clearly "unranked" sandbox.

## 4. Roguelite elements that fit determinism (Option A)

| Element | Deterministic? | Notes |
|---|---|---|
| Escalating segments | yes | speed/density curve from distance + seed breakpoints |
| Choice gates (pick 1 of N) | yes | menu drawn from seed; pick is a recorded input |
| Power-ups (shield/magnet/slow/2x) | yes | pure sim effects, timed windows |
| Deterministic "elite" hazard waves | yes | seed-driven patterns per segment |
| Cosmetic unlocks | yes | localStorage; no sim effect |
| Per-run RNG loot / random perks | NO | breaks "same for everyone" — Option B only |
| Pre-run perk loadout | NO (ranked) | breaks leaderboard parity — unranked/Option B only |

## 5. Leaderboard implications

- Input model extends: `jumpSteps` → `inputs = { jumps: number[], choices: [{step, pick}] }`.
- `replay.js` + the Worker consume choices; the score stays server-authoritative.
- Re-pin the determinism keystone (new mechanics change scores) — same process as
  every prior version.
- Board stays daily + replay-verified. No backend schema change beyond the
  richer submit payload.

## 6. Architecture / effort (Option A)

1. **Segments + difficulty curve** in `world.js` (deterministic breakpoints).
2. **Power-up system**: a pure `powerups.js` (effect timers, sim hooks) + player/
   world integration; renderer sprites; audio cues.
3. **Choice gates**: world spawns a gate; input layer gains a "choose" action
   (still one-button-friendly: gate pauses, cycles options, tap to pick — or a
   left/right pick on gates). Record the pick.
4. **Replay + Worker**: extend the input timeline + validation.
5. **Cosmetic meta**: unlock tracking in storage; a cosmetics picker.
6. **Tests**: powerup effects, choice determinism, replay==live, Worker
   validation of the richer payload. **Browser-verify** each mechanic.

**Effort:** the largest single version — it touches the sim core (segments,
power-ups, choice inputs), the replay/Worker contract, and adds a meta layer.
Best split into sub-releases: v3.0 (segments + power-ups + choice gates,
cosmetic meta) then v3.1+ (more power-ups, more cosmetics).

## 7. Risks

- **One-button purity.** Choice gates must not add a second required control.
  Mitigation: gate auto-cycles options; the existing jump/tap picks. Keep it one
  action.
- **Fairness creep.** Any gameplay unlock silently breaks the board. Hold the
  line at cosmetic-only for the ranked daily.
- **Scope.** Easy to sprawl. Ship the smallest fun core first (segments + 3-4
  power-ups + choice gate), iterate.
- **Determinism regressions.** Every new sim mechanic must draw only from the
  seeded stream and be covered by a re-pinned keystone.

## 8. Decisions (locked 2026-07-15)

1. **Model:** ✅ Deterministic daily roguelite (A). One shot, one seed, same for
   everyone; depth via deterministic segments + power-ups + choice gates.
2. **Meta:** ✅ Cosmetic-only. Skins/trails/flair via play; zero gameplay
   advantage → the daily leaderboard stays pure.
3. **Structure:** ✅ Evolve the daily itself into the roguelite. One game, one
   mode, one board. No classic/roguelite toggle.
4. **Choice control:** ✅ Auto-cycle + tap-to-pick. Preserves one button.

### Key simplification the control choice unlocks

Because gate options **auto-cycle deterministically** and the player picks with
the **same tap**, a choice reduces to *"the player tapped at step S while a gate
was active."* The sim (and the replay) derive *which* option from S:
`pick = floor((S − gateStart) / cyclePeriod) % N`.

So the leaderboard input model **does not need a new `choices` array** — it stays
a single ascending list of tap-step indices (today's `jumpSteps`, renamed
`tapSteps`). The sim decides per tap whether it's a **jump** (no gate active) or a
**pick** (gate active). `replay.js` + the Worker change almost nothing — same
contract, same validation. This keeps v2.0's replay-verified leaderboard intact.

## 9. Build plan

**v3.0 — roguelite core**
1. `world.js`: escalating **segments** (deterministic speed/density breakpoints
   from distance + seed) and **choice-gate** spawns.
2. `powerups.js` (new, pure): shield / coin-magnet / slow-mo / 2×-window; timed
   effects; sim hooks in player/world; renderer sprites + audio cues.
3. Input: a tap while a gate is active = **pick** (auto-cycle + select), else
   jump. Record tap steps exactly as today.
4. `replay.js` + Worker: consume the same tap timeline; re-pin the keystone;
   extend Worker input validation only if bounds change.
5. Tests: power-up effects, gate pick determinism, replay==live, Worker still
   green. Browser-verify each mechanic.

**v3.1+ — cosmetic meta**
6. Unlock tracking in `storage.js` (reach segment N, games played, best);
   cosmetics picker; renderer skin/trail selection. No sim/board effect.

**Effort:** the largest version — touches the sim core, but the input/replay
contract barely moves thanks to the tap-timeline simplification. Split as above;
ship the smallest fun core (segments + 3–4 power-ups + one gate type) first.
