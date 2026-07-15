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
  // TODO(v1.0): listen for keydown (Space, ArrowUp — preventDefault so the page
  // doesn't scroll), pointerdown/touchstart (preventDefault to avoid synthetic
  // click + double-fire), and mouse click. Debounce so one tap = one jump.
  // Return an unbind() that removes every listener. Nothing but jump in v1 (§3).
  void opts;
  throw new Error('TODO(v1.0): implement bindInput');
}
