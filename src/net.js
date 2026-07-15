// Leaderboard network client (v2.0). Thin fetch wrappers around the Worker.
// Every call is best-effort: any failure (offline, backend down, non-2xx)
// resolves to null so the game degrades gracefully and never throws.

/**
 * fetchBoard — GET the day's public board.
 * @param {string} base - Worker base URL (no trailing slash).
 * @param {string} day - "YYYYMMDD"
 * @returns {Promise<{day:string, entries:Array<{name:string,score:number}>}|null>}
 */
export async function fetchBoard(base, day) {
  try {
    const res = await fetch(`${base}/board/${day}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * submitScore — POST a run's inputs for replay-verified scoring.
 * @param {string} base - Worker base URL.
 * @param {{dayKey:string, jumpSteps:number[], name:string, clientId:string}} payload
 * @returns {Promise<{day:string,score:number,best:number,rank:number,entries:Array}|null>}
 */
export async function submitScore(base, payload) {
  try {
    const res = await fetch(`${base}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
