// Input — map tap / Space / ArrowUp / mouse to a held jump BUTTON (§3, v3.6).
// DOM event wiring lives here; the sim never reads events directly. The button is
// a level (down/up), not an edge: holding rides the full jump arc, a quick tap is
// a short hop. The session derives the press edge + jump-cut from the held state.

function isJumpKey(e) {
  return e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'ArrowUp';
}

/**
 * bindInput — attach listeners that drive the jump button up/down.
 * @param {Object} opts
 * @param {EventTarget} opts.target - element to listen on for pointer-down. Pass a
 *   broad target (e.g. document) so a tap anywhere jumps — comfortable for thumbs
 *   low on a phone. Taps on buttons/links are ignored so UI still works.
 * @param {() => void} opts.onDown - button pressed (start / sustain a jump).
 * @param {() => void} opts.onUp - button released (cut a rising jump short).
 * @returns {() => void} unbind - removes all listeners.
 */
export function bindInput(opts) {
  const { target, onDown, onUp } = opts;
  const down = () => onDown && onDown();
  const up = () => onUp && onUp();

  const onKeyDown = (e) => {
    if (!isJumpKey(e)) return;
    e.preventDefault(); // stop page scroll
    if (!e.repeat) down(); // key auto-repeat isn't a new press; the hold persists
  };
  const onKeyUp = (e) => {
    if (!isJumpKey(e)) return;
    e.preventDefault();
    up();
  };
  const onPointerDown = (e) => {
    // Let taps on interactive controls (mute, stats, result buttons) do their own
    // thing instead of jumping.
    if (e.target && e.target.closest && e.target.closest('button, a, input, select')) return;
    e.preventDefault(); // pointerdown handles touch + mouse; blocks synthetic click double-fire
    down();
  };
  // Release anywhere ends the hold — the pointer may lift outside the target.
  const onPointerUp = () => up();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  target.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  return function unbind() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    target.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  };
}
