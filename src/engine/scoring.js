// Streak-combo scoring (v1.1). Pure, no DOM — steppable headless for the
// determinism keystone (§9). Collecting coins consecutively builds a multiplier;
// letting a coin pass uncollected resets the combo. Score = distance + coins.

import { COIN } from '../constants.js';
import { aabbIntersects } from './collision.js';

/**
 * createScorer — track the within-run coin combo and coin score.
 * @returns {Object} scorer: { comboCount, multiplier, coinScore, coinsCollected,
 *                             collect(), miss(), total(distanceScore) }
 */
export function createScorer() {
  const s = {
    comboCount: 0, // current consecutive pickups (the streak combo)
    multiplier: 1,
    coinScore: 0,
    coinsCollected: 0,

    collect() {
      s.comboCount += 1;
      s.multiplier = Math.min(COIN.maxMult, Math.ceil(s.comboCount / COIN.comboStep));
      s.coinScore += COIN.base * s.multiplier;
      s.coinsCollected += 1;
    },

    miss() {
      s.comboCount = 0;
      s.multiplier = 1;
    },

    total(distanceScore) {
      return distanceScore + s.coinScore;
    },
  };
  return s;
}

/**
 * resolveCoins — for one sim step, collect coins overlapping the player and mark
 * coins that scrolled fully past the player as missed. Mutates `coins` in place.
 *
 * @param {Array<{x:number,y:number,w:number,h:number}>} coins
 * @param {{x:number,y:number,w:number,h:number}} playerBox - full sprite box (generous pickup).
 * @param {Object} scorer - from createScorer().
 */
export function resolveCoins(coins, playerBox, scorer) {
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    if (aabbIntersects(playerBox, c)) {
      scorer.collect();
      coins.splice(i, 1);
    } else if (c.x + c.w < playerBox.x) {
      scorer.miss(); // fully past the player, never collected -> combo breaks
      coins.splice(i, 1);
    }
  }
}
