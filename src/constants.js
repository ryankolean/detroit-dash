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

// TODO(v1.0): gameplay tuning — gravity, jumpVelocity, coyoteTimeMs, baseSpeed,
// speedRampPerMeter, hitboxInset, obstacle spacing bounds, etc. (§3). Add as the
// engine is built so world.js / player.js draw their numbers from here.
