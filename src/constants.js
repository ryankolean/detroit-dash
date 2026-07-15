// Detroit Dash — tuning constants + launch epoch (§4, §8).
// Keep all magic numbers here so tuning is one file. Pure data, no DOM.

// PROVISIONAL: launch date used for the "Detroit Dash #N" puzzle number
// (puzzleNumber = daysSince(LAUNCH_EPOCH)). Confirm the real launch date and
// update this before v1.0 ships. Format: 'YYYY-MM-DD', interpreted as the
// America/Detroit day key (§4, open item §12).
export const LAUNCH_EPOCH = '2026-07-20'; // TODO(v1.0): confirm real launch date.

// Timezone that defines the daily rollover for all players (§4).
export const TIMEZONE = 'America/Detroit';

// localStorage namespace (§6). Bump the version suffix only on a breaking schema change.
export const STORAGE_KEY = 'detroit-dash/v1';

// Public play URL, used in the share card (§5).
export const PLAY_URL = 'https://ryankolean.github.io/detroit-dash/';

// Fixed simulation step (§8). The loop updates in whole steps of DT seconds so
// the sim is deterministic and headless-steppable for the keystone test (§9).
export const DT = 1 / 60;

// Logical play-field size in world units (renderer scales to the canvas).
export const WORLD = { width: 800, height: 450, groundY: 380 };

// Player sim tuning (§3). Units: world-units, seconds. Gravity is +down.
export const PLAYER = {
  x: 120, // fixed horizontal position; the world scrolls past
  width: 34,
  height: 44,
  gravity: 2400, // world-units / s^2
  jumpVelocity: -760, // instantaneous upward velocity on jump
  coyoteTime: 0.08, // seconds after leaving ground a jump still fires (§3)
  hitboxInset: 6, // forgiving hitbox: inset from the sprite on each side (§3)
};

// World scroll + obstacle spawn tuning (§3, §4). All spawn randomness is drawn
// from the seeded rng stream — never Math.random().
export const WORLD_TUNING = {
  baseSpeed: 260, // world-units / s at distance 0
  maxSpeed: 620, // speed cap
  speedRampPerMeter: 0.9, // speed gained per meter of distance
  gapMin: 240, // min horizontal gap to the next obstacle (world-units)
  gapMax: 460, // max gap; narrows slightly as speed climbs
  obstacleWidths: [26, 34, 48], // simple-shape obstacle widths (rng.pick)
  obstacleHeights: [34, 52, 70], // heights (rng.pick)
};

// 1 meter of score == this many world-units of scroll. Score = floor(distance).
export const METERS_PER_UNIT = 0.1;
