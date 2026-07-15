// Sound FX (v1.2) — synthesized via WebAudio, no audio files. Blips for jump,
// coin, and death, plus a persisted mute toggle. All calls are defensive: if
// WebAudio is missing or the context can't start, they no-op (never throw).

import { MUTE_KEY } from '../constants.js';

/**
 * createAudio — build the sound layer. The AudioContext is created lazily on the
 * first blip so it starts inside a user gesture (browser autoplay policy).
 * @returns {Object} { muted, setMuted(v), toggleMute(), resume(), jump(), coin(), death() }
 */
export function createAudio() {
  let ctx = null;
  let muted = false;
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    // localStorage blocked (private mode) — default unmuted.
  }

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function blip({ freq, freqEnd, dur, type = 'square', peak = 0.14 }) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur); // fast decay
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  function setMuted(v) {
    muted = !!v;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      // best-effort persistence
    }
  }

  return {
    get muted() {
      return muted;
    },
    setMuted,
    toggleMute() {
      setMuted(!muted);
      return muted;
    },
    resume() {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume();
    },
    jump() {
      blip({ freq: 320, freqEnd: 620, dur: 0.12, type: 'square', peak: 0.12 });
    },
    coin() {
      blip({ freq: 880, freqEnd: 1320, dur: 0.1, type: 'triangle', peak: 0.13 });
    },
    death() {
      blip({ freq: 400, freqEnd: 80, dur: 0.5, type: 'sawtooth', peak: 0.16 });
    },
  };
}
