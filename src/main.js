// Detroit Dash — bootstrap / entry point (§8).
// Wires the pieces together: resolve today's puzzle, decide play-vs-locked,
// mount the canvas, run the loop or show the result/lock screen. This is the
// only module that assembles DOM + engine + storage; keep game rules in the
// engine modules, not here.

import { dayKey, seedFromDay, puzzleNumber } from './daily.js';
import { mulberry32 } from './engine/rng.js';
import { createLoop } from './engine/loop.js';
import { createWorld } from './engine/world.js';
import { createPlayer } from './engine/player.js';
import { createRenderer } from './engine/renderer.js';
import { bindInput } from './engine/input.js';
import { playerHitsAny } from './engine/collision.js';
import { load, save, recordRun, isLockedFor } from './storage.js';
import { buildShareText, copyShareText } from './shareCard.js';

// TODO(v1.0): boot sequence —
//   1. const now = new Date(); const today = dayKey(now);
//   2. const state = load();
//   3. Resolve puzzle identity: seedFromDay(today) -> mulberry32 stream; puzzleNumber(today).
//   4. If isLockedFor(state, today): render the result/lock screen + countdown to
//      next Detroit midnight. Do NOT start a run (one-shot lock §6).
//   5. Else: create world (seeded rng), player, renderer; bindInput -> player.jump;
//      run createLoop({ update, render }). On update: step world + player, check
//      playerHitsAny(player.hitbox(), world.obstacles). On collision: stop loop,
//      recordRun(state, { todayKey: today, score: floor(world.distance) }), save,
//      show result screen (score/best/streak/Share -> buildShareText + copyShareText).
//   6. Live HUD: update #hud-puzzle / #hud-score / #hud-streak during the run (§5, §7).
//
// Keep this thin — it orchestrates, it does not implement physics or spawn logic.

// Referenced here so the import graph is wired for the next session; remove these
// void lines as each is used.
void dayKey; void seedFromDay; void puzzleNumber; void mulberry32;
void createLoop; void createWorld; void createPlayer; void createRenderer;
void bindInput; void playerHitsAny;
void load; void save; void recordRun; void isLockedFor;
void buildShareText; void copyShareText;

throw new Error('TODO(v1.0): implement Detroit Dash bootstrap (see docs/IMPLEMENTATION_PLAN.md).');
