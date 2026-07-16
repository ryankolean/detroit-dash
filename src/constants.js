// Detroit Dash — tuning constants + launch epoch (§4, §8).
// Keep all magic numbers here so tuning is one file. Pure data, no DOM.

// Launch date for the "Detroit Dash #N" puzzle number
// (puzzleNumber = daysSince(LAUNCH_EPOCH), launch day = #1). Confirmed
// 2026-07-20. Format: 'YYYY-MM-DD', interpreted as the America/Detroit day key (§4).
export const LAUNCH_EPOCH = '2026-07-20';

// Timezone that defines the daily rollover for all players (§4).
export const TIMEZONE = 'America/Detroit';

// localStorage namespace (§6). Bump the version suffix only on a breaking schema change.
export const STORAGE_KEY = 'detroit-dash/v1';

// localStorage key for the sound mute preference (v1.2). Separate from the save
// state so audio settings never risk the score schema.
export const MUTE_KEY = 'detroit-dash/muted';

// Public play URL, used in the share card (§5).
export const PLAY_URL = 'https://ryankolean.github.io/detroit-dash/';

// Leaderboard Worker URL (v2.0). Empty = leaderboard disabled; the game stays
// fully playable with no backend. Set to the deployed Worker URL to enable
// (see worker/README.md). No trailing slash.
export const BACKEND_URL = '';

// localStorage key for the leaderboard identity (display name + client token).
export const CLIENT_KEY = 'detroit-dash/client';

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
//
// Fairness (v3.0): difficulty ramps SLOWLY, and the gap to the next obstacle
// GROWS with speed so reaction time stays roughly constant — obstacles never
// crowd. gap = max(gapFloor, speed * reactionTime) + rng(0, gapVariety).
export const WORLD_TUNING = {
  baseSpeed: 250, // world-units / s at distance 0
  maxSpeed: 540, // speed cap (lower than v1 for fairness)
  speedRampPerMeter: 0.3, // slow ramp: reaches the cap around ~950 m
  reactionTime: 0.85, // min seconds of runway between obstacles (fairness)
  gapFloor: 240, // absolute minimum gap (world-units), regardless of speed
  gapVariety: 130, // rng spread added on top of the reaction-time gap
  obstacleWidths: [26, 34, 48], // simple-shape obstacle widths (rng.pick)
  obstacleHeights: [34, 52, 70], // heights (rng.pick)
};

// 1 meter of score == this many world-units of scroll. Distance score = floor(meters).
export const METERS_PER_UNIT = 0.1;

// Collectibles + streak-combo scoring (v1.1). Coins spawn from the seeded stream
// so the course stays identical for everyone; collecting is auto on overlap.
export const COIN = {
  size: 20, // square coin, world-units
  elevatedY: 150, // elevated coins sit this many units above the ground (jump to reach)
  clusterGap: 44, // horizontal spacing between coins in a cluster
  leadOffset: 90, // spawn coins this far past the right edge, trailing the obstacle
  base: 50, // base points per coin, before the combo multiplier
  comboStep: 2, // coins per multiplier tier (2 coins -> +1x)
  maxMult: 5, // multiplier cap
  maxPerCluster: 3, // rng picks 0..this many coins per spawn
  iconChance: 0.35, // chance a cluster's lead coin is a Detroit-icon bonus (v1.4)
  iconBonus: 200, // base points for an icon token (before the combo multiplier)
  iconTypes: 3, // Joe Louis fist, Spirit of Detroit, Guardian Building
};

// Roguelite: choice gates + power-ups (v3.0). Deterministic and input-driven —
// gate menus are drawn from the seed; the player picks with the same one-button
// tap. All effects are pure sim (no Math.random).
export const POWERUP_TYPES = ['shield', 'magnet', 'slow', 'double'];

// A choice gate opens each time the run crosses another segment.
export const SEGMENT_METERS = 300; // generous runway before the first gate + between gates

export const GATE = {
  optionCount: 3, // options offered per gate (distinct, drawn from the seed)
  cyclePeriodSteps: 42, // ~0.7 s each option is highlighted at 60 fps
  timeoutSteps: 420, // ~7 s open, then auto-pick the highlighted option
};

// Power-up effects. Durations are in METERS of distance (so they feel the same
// regardless of speed). All deterministic.
export const POWERUPS = {
  shieldHits: 1, // hits absorbed per shield pickup
  maxShield: 2, // cap on banked shields (v3.1 balance — no invincibility hoarding)
  magnetMeters: 70, // coin-magnet duration
  magnetRange: 300, // world-units ahead within which coins are pulled in
  slowMeters: 55, // slow-mo duration
  slowFactor: 0.6, // scroll speed multiplier while slow-mo is active
  doubleMeters: 70, // 2x coin-payout window duration
  doubleFactor: 2, // coin payout multiplier while active
};

// Cosmetic player skins (v3.1). Unlocked by play; ZERO gameplay effect, so the
// leaderboard stays fair. `unlock` null = always available. Types: games (played),
// best (best score), icons (lifetime Detroit-icon tokens), segment (best segment).
export const SKINS = [
  { id: 'classic', name: 'Classic', body: '#ff6b35', dark: '#c44a1e', unlock: null },
  { id: 'steel', name: 'Motor City', body: '#7fa8d0', dark: '#3f6b93', unlock: { type: 'games', value: 3 } },
  { id: 'vernor', name: 'Vernors', body: '#6fbf5b', dark: '#3f8a33', unlock: { type: 'best', value: 1000 } },
  { id: 'gold', name: 'Gold', body: '#ffcf40', dark: '#c79a1e', unlock: { type: 'icons', value: 10 } },
  { id: 'midnight', name: 'Midnight', body: '#9b6cff', dark: '#5f3fb0', unlock: { type: 'segment', value: 5 } },
];

// Parallax Detroit skyline (v1.2, pixel-art rework v1.3). Cosmetic only —
// generated from its OWN seed, never the gameplay stream (§4). A curated Detroit
// silhouette (Renaissance Center, gothic spires, brick riverfront towers) plus
// seeded filler + far-layer distance. Colors live in the renderer's day/night
// themes; this file is geometry only.
export const SKYLINE_SEED = 0x1701d; // fixed cosmetic seed ("Detroit")
export const SKYLINE = {
  spanTiles: 2, // strip width = this many screen-widths, then wrap
  farFactor: 0.18, // parallax scroll factor for the distant back layer
  nearFactor: 0.42, // parallax scroll factor for the landmark front layer
  baseY: 380, // buildings rise from here (== WORLD.groundY)
};

// Cosmetic particle FX (v1.2): jump dust, coin sparkle, death burst. Not part of
// the sim — uses non-deterministic spread and never affects score or course.
export const PARTICLES = {
  gravity: 900, // world-units / s^2 pulling particles down
  jumpDust: { count: 8, life: 0.4, speed: 90, size: 4, color: '#9fb4cc' },
  coinSpark: { count: 10, life: 0.5, speed: 160, size: 3, color: '#ffd166' },
  deathBurst: { count: 20, life: 0.7, speed: 240, size: 4, color: '#ff6b35' },
};
