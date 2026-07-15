// Dev mode — URL-flag overrides for testing game mechanics without the
// once-a-day one-shot lock. Never active in production: flags come only from the
// query string, so the live Pages URL (no query) behaves exactly as v1.0 ships.
//
// Flags (all optional):
//   ?dev            bypass the one-shot lock; allow unlimited replays; skip
//                   persistence so real streak/best aren't polluted; show a
//                   DEV badge + a "Play again" button on the result screen.
//   ?day=YYYYMMDD   force a specific daily course (overrides today's day key).
//   ?seed=<uint>    force a raw seed directly (overrides seedFromDay).
//
// ?day and ?seed imply dev mode even without ?dev, so you can jump straight to a
// specific course and replay it.

/**
 * getDevConfig — parse dev flags from the current URL.
 * @param {string} [search] - location.search (injectable for tests).
 * @returns {{ enabled: boolean, day: string|null, seed: number|null }}
 */
export function getDevConfig(search = typeof location !== 'undefined' ? location.search : '') {
  const params = new URLSearchParams(search);

  const day = params.get('day');
  const validDay = day && /^\d{8}$/.test(day) ? day : null;

  const seedRaw = params.get('seed');
  const seedNum = seedRaw !== null && seedRaw !== '' ? Number(seedRaw) : NaN;
  const seed = Number.isFinite(seedNum) ? seedNum >>> 0 : null;

  const enabled = params.has('dev') || validDay !== null || seed !== null;

  return { enabled, day: validDay, seed };
}
