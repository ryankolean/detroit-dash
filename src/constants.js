// Detroit Dash — tuning constants + launch epoch (§4, §8).
// Keep all magic numbers here so tuning is one file. Pure data, no DOM.

// Launch date for the "Detroit Dash #N" puzzle number
// (puzzleNumber = daysSince(LAUNCH_EPOCH), launch day = #1). Confirmed
// 2026-07-20. Format: 'YYYY-MM-DD', interpreted as the America/Detroit day key (§4).
export const LAUNCH_EPOCH = '2026-07-20';

// Timezone that defines the daily rollover for all players (§4).
export const TIMEZONE = 'America/Detroit';

// PLAYTEST mode (temporary): unlimited daily plays for everyone — bypasses the
// one-shot lock and shows a Play-again button, while best/streak still persist.
// Set back to false to restore the one-shot daily. Keep OFF once the ranked
// leaderboard is live (unlimited plays + a ranked board breaks "one shot" — see
// ROADMAP v3.2, extra plays must be unranked).
export const PLAYTEST = true;

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
// Fairness (v3.0) + no-plateau difficulty (v3.5): the gap to the next obstacle is
// speed * reactionTime, so obstacles never crowd — BUT reactionTime now DECAYS
// with distance, tightening the reaction window so difficulty keeps rising the
// longer you survive (instead of plateauing once speed hits its cap).
// gap = max(gapFloor, speed * reaction(meters)) + rng(0, gapVariety),
//   reaction(m) = max(reactionFloor, reactionTime - reactionDrop * m).
export const WORLD_TUNING = {
  baseSpeed: 250, // world-units / s at distance 0
  maxSpeed: 680, // speed cap (raised so pace keeps climbing longer)
  speedRampPerMeter: 0.3, // reaches the cap around ~1430 m
  reactionTime: 0.85, // starting seconds of runway between obstacles (early game)
  reactionFloor: 0.52, // reaction window never drops below this (still clearable)
  reactionDrop: 0.00014, // seconds of runway removed per meter (hits the floor ~2360 m)
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

// A choice gate opens each time the run crosses a segment ("level"). Segments
// get progressively longer as the run speeds up (v3.3): the first is `first`
// meters, and each subsequent one is `grow` meters longer than the last.
export const SEGMENT = {
  first: 260, // meters to the first gate
  grow: 70, // each segment is this many meters longer than the previous
};

export const GATE = {
  optionCount: 3, // options offered per gate (distinct, drawn from the seed)
  cyclePeriodSteps: 42, // ~0.7 s each option is highlighted at 60 fps
  timeoutSteps: 420, // ~7 s open, then auto-pick the highlighted option
};

// Post-pick "3 · 2 · 1 · GO" countdown before gameplay resumes (v3.3). Frozen,
// deterministic. Each label holds `stepPer` steps; total = 4 * stepPer.
export const COUNTDOWN = {
  stepPer: 32, // ~0.53 s per label at 60 fps -> ~2.1 s total
  labels: ['3', '2', '1', 'GO'],
};

// Power-up effects. Durations are in METERS of distance (so they feel the same
// regardless of speed). All deterministic.
export const POWERUPS = {
  shieldHits: 1, // hits absorbed per shield pickup
  maxShield: 5, // shields stack up to 5 (v3.5); the ring colors up per tier
  magnetMeters: 70, // coin-magnet duration
  magnetRange: 300, // world-units ahead within which coins are pulled in
  slowMeters: 95, // slow-mo duration (v3.5: longer)
  slowFactor: 0.78, // scroll speed multiplier while slow-mo is active (v3.5: less slow)
  doubleMeters: 70, // 2x coin-payout window duration
  doubleFactor: 2, // coin payout multiplier while active
};

// Shield-ring colors by stacked count (v3.5): cyan -> green -> gold -> orange -> red.
export const SHIELD_TIERS = ['#5fd0e0', '#6fe08f', '#ffd166', '#ff9f43', '#ff5a3c'];

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

// Cosmetic trails (v3.1). A fading streak behind the runner. Cosmetic only.
// `color: null` = use the current skin color. `swatch` colors the picker dot.
export const TRAILS = [
  { id: 'none', name: 'None', swatch: 'transparent', unlock: null, color: null, size: 0, life: 0, count: 0, speed: 0 },
  { id: 'spark', name: 'Spark', swatch: '#f0f6ff', unlock: { type: 'games', value: 5 }, color: null, size: 3, life: 0.35, count: 1, speed: 40 },
  { id: 'ribbon', name: 'Ribbon', swatch: '#5fd0e0', unlock: { type: 'best', value: 2000 }, color: null, size: 5, life: 0.5, count: 1, speed: 20 },
  { id: 'ember', name: 'Ember', swatch: '#ff8a3c', unlock: { type: 'segment', value: 8 }, color: '#ff8a3c', size: 4, life: 0.45, count: 2, speed: 60 },
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
