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
    iconsCollected: 0,

    // `coin` may carry an `icon` (a Detroit-icon bonus token, v1.4) worth more.
    collect(coin) {
      s.comboCount += 1;
      s.multiplier = Math.min(COIN.maxMult, Math.ceil(s.comboCount / COIN.comboStep));
      const isIcon = coin && coin.icon != null;
      s.coinScore += (isIcon ? COIN.iconBonus : COIN.base) * s.multiplier;
      s.coinsCollected += 1;
      if (isIcon) s.iconsCollected += 1;
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
 * Returns the coins collected this step (for FX; center-of-coin positions).
 *
 * @param {Array<{x:number,y:number,w:number,h:number}>} coins
 * @param {{x:number,y:number,w:number,h:number}} playerBox - full sprite box (generous pickup).
 * @param {Object} scorer - from createScorer().
 * @returns {Array<{x:number,y:number}>} collected coin centers this step.
 */
export function resolveCoins(coins, playerBox, scorer) {
  const collected = [];
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    if (aabbIntersects(playerBox, c)) {
      scorer.collect(c);
      collected.push({ x: c.x + c.w / 2, y: c.y + c.h / 2, icon: c.icon ?? null });
      coins.splice(i, 1);
    } else if (c.x + c.w < playerBox.x) {
      scorer.miss(); // fully past the player, never collected -> combo breaks
      coins.splice(i, 1);
    }
  }
  return collected;
}
