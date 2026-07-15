// Renderer — canvas draw (§7, §8). The ONLY engine module that touches the DOM
// besides input.js. v1.0: simple shapes / programmer-art, no parallax/particles (§7).

/**
 * createRenderer — bind to a canvas and return draw helpers.
 * @param {HTMLCanvasElement} canvas
 * @returns {Object} renderer with { resize(), clear(), drawWorld(world), drawPlayer(player), drawHud(hud), ... }
 */
export function createRenderer(canvas) {
  // TODO(v1.0):
  //   - resize(): size the backing store to CSS size * devicePixelRatio; scale ctx.
  //   - clear(): paint the background.
  //   - drawPlayer / drawWorld: simple filled rects for player + obstacles + ground.
  //   - keep all drawing here; the sim (world/player) stays DOM-free.
  //   HUD text is DOM (index.html #hud), so it can be updated outside the canvas.
  void canvas;
  throw new Error('TODO(v1.0): implement createRenderer');
}
