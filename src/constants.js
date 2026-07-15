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
};

// Parallax Detroit skyline (v1.2). Cosmetic only — generated from its OWN seed,
// never the gameplay stream, so obstacle/coin determinism is untouched (§4).
export const SKYLINE_SEED = 0x1701d; // fixed cosmetic seed ("Detroit")
export const SKYLINE = {
  // Back-to-front layers. `factor` = scroll speed vs. the world (0 = static,
  // 1 = foreground). Taller/darker far, shorter/lighter near for depth.
  layers: [
    { factor: 0.15, color: '#0d2038', minH: 60, maxH: 150, minW: 30, maxW: 70, gap: 8, baseY: 380 },
    { factor: 0.35, color: '#122b47', minH: 40, maxH: 110, minW: 26, maxW: 60, gap: 10, baseY: 380 },
  ],
  spanTiles: 3, // generate this many screen-widths of buildings per layer, then wrap
  litWindow: '#1d4e89', // occasional lit window accent
};

// Cosmetic particle FX (v1.2): jump dust, coin sparkle, death burst. Not part of
// the sim — uses non-deterministic spread and never affects score or course.
export const PARTICLES = {
  gravity: 900, // world-units / s^2 pulling particles down
  jumpDust: { count: 8, life: 0.4, speed: 90, size: 4, color: '#9fb4cc' },
  coinSpark: { count: 10, life: 0.5, speed: 160, size: 3, color: '#ffd166' },
  deathBurst: { count: 20, life: 0.7, speed: 240, size: 4, color: '#ff6b35' },
};
