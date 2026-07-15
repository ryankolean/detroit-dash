// Input — map tap / Space / ArrowUp / mouse click to a single `jump` action (§3).
// DOM event wiring lives here; the sim never reads events directly.

/**
 * bindInput — attach listeners that call `onJump` for any jump input.
 * @param {Object} opts
 * @param {HTMLElement} opts.target - element to listen on (usually the canvas).
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
    e.preventDefault(); // pointerdown handles both touch + mouse; blocks synthetic click double-fire
    onJump();
  };

  window.addEventListener('keydown', onKey);
  target.addEventListener('pointerdown', onPointer);

  return function unbind() {
    window.removeEventListener('keydown', onKey);
    target.removeEventListener('pointerdown', onPointer);
  };
}
