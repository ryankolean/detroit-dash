// Input — map tap / Space / ArrowUp / mouse click to a single `jump` action (§3).
// DOM event wiring lives here; the sim never reads events directly.

/**
 * bindInput — attach listeners that call `onJump` for any jump input.
 * @param {Object} opts
 * @param {EventTarget} opts.target - element to listen on. Pass a broad target
 *   (e.g. document) so a tap anywhere on the screen jumps — comfortable for
 *   thumbs low on a phone. Taps on buttons/links are ignored so UI still works.
 * @param {() => void} opts.onJump - fired on tap / Space / ArrowUp / click.
 * @returns {() => void} unbind - removes all listeners.
 */
export function bindInput(opts) {
  const { target, onJump } = opts;

  const onKey = (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault(); // stop page scroll
      if (!e.repeat) onJump();
    }
  };
  const onPointer = (e) => {
    // Let taps on interactive controls (mute, stats, result buttons) do their
    // own thing instead of jumping.
    if (e.target && e.target.closest && e.target.closest('button, a, input, select')) return;
    e.preventDefault(); // pointerdown handles touch + mouse; blocks synthetic click double-fire
    onJump();
  };

  window.addEventListener('keydown', onKey);
  target.addEventListener('pointerdown', onPointer);

  return function unbind() {
    window.removeEventListener('keydown', onKey);
    target.removeEventListener('pointerdown', onPointer);
  };
}
