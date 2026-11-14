// All sound is synthesized with Web Audio (square/triangle/sawtooth blips).
var ac = null;
export var muted = false;
export function setMute(m) { muted = m; }

// Sound effects go through one bus, so they can be balanced against the music (core/music.js) in one place.
// 1.6 = about +4 dB over the prototype's levels, so the blips cut through the music on headphones.
const SFX_GAIN = 1.6;
var sfx = null;
function sfxBus() { if (!sfx) { sfx = ac.createGain(); sfx.gain.value = SFX_GAIN; sfx.connect(ac.destination); } return sfx; }

// Called on every tap/click. Browsers only allow sound after a user gesture, so this is where the
// AudioContext starts, and where the music gets its one chance to unlock (see core/music.js).
export var gestureHooks = [];
export function audioCtx() { return ac; }
export function audio() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
  if (ac && ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
  if (ac) gestureHooks.forEach(function (h) { h(ac); });
}
export function beep(f, d, type, v, when) {
  if (muted || !ac) return;
  try {
    var t0 = ac.currentTime + (when || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square'; o.frequency.value = f; g.gain.setValueAtTime(v || 0.04, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + (d || 0.07));
    o.connect(g); g.connect(sfxBus()); o.start(t0); o.stop(t0 + (d || 0.07) + 0.02);
  } catch (e) {}
}
