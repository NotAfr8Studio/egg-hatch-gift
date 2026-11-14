import { gestureHooks, muted } from './audio.js';

// Background music: mp3 files in public/music/ (loudness-matched copies of the originals in private/music/).
// Each track only downloads when a screen asks for it. Two players ("decks") take turns so tracks crossfade.
// The players run through Web Audio because iPhone Safari ignores the volume of a plain <audio> element.

const TRACKS = {
  town: { file: 'town.mp3', loop: true },      // start, tapping, quiz, mud wash: calm, sits under the tap blips
  upbeat: { file: 'upbeat.mp3', loop: true },  // snakes, rolling run, home and library: PlayOnLoop loop, repeated 8x in the file (no mp3 gap every 17 s)
  wild: { file: 'wild.mp3', loop: true },      // raccoon encounter ("A wild RACCOON appeared!")
  trainer: { file: 'trainer.mp3', loop: true },// raccoon chase: the fastest track, 161 bpm
  rap: { file: 'rap.mp3', loop: false, next: 'upbeat' }, // the hatch; plays once, then home music
};
const VOL = 0.25;   // music sits under the sound effects (was 0.35; lowered 2026-11-12 so blips read on headphones)
const FADE = 0.5;   // crossfade, seconds

var ac = null, master = null, decks = [], cur = null, want = null, listeners = [];

// A tiny silent WAV: playing it during the first tap unlocks each player for later, timer-driven starts.
function silentWav() {
  var n = 441, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), s = function (o, t) { for (var i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}

function makeDeck() {
  var el = new Audio(); el.preload = 'auto'; el.setAttribute('playsinline', '');
  var g = ac.createGain(); g.gain.value = 0;
  ac.createMediaElementSource(el).connect(g); g.connect(master);
  var d = { el: el, g: g, name: null, token: 0 };
  el.addEventListener('ended', function () { var t = TRACKS[d.name]; if (cur === d && t && t.next) { cur = null; play(t.next); } });
  return d;
}

// First tap: build the players and unlock them, then start whatever the current screen asked for.
gestureHooks.push(function (ctx) {
  if (ac) return; ac = ctx;
  try {
    master = ac.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ac.destination);
    var silent = silentWav();
    decks = [makeDeck(), makeDeck()];
    decks.forEach(function (d) { d.el.src = silent; var p = d.el.play(); if (p && p.then) p.then(function () { d.el.pause(); }, function () {}); });
  } catch (e) { ac = null; decks = []; return; }
  if (want) { var w = want; want = null; play(w); }
});

function fadeTo(d, v, then) {
  var t = ac.currentTime; d.g.gain.cancelScheduledValues(t); d.g.gain.setValueAtTime(d.g.gain.value, t); d.g.gain.linearRampToValueAtTime(v, t + FADE);
  var tok = ++d.token; if (then) setTimeout(function () { if (d.token === tok) then(); }, FADE * 1000 + 50);
}

// Play a track by name (null = silence). `keep`: if that track is already playing, let it run instead.
export function play(name, keep) {
  if (keep && ((cur && cur.name === keep) || want === keep)) return;
  if (!ac || !decks.length) { want = name; return; }   // before the first tap: remember it
  want = name;
  if (cur && cur.name === name) return;
  if (cur) { var old = cur; fadeTo(old, 0, function () { old.el.pause(); }); }
  cur = null;
  if (name && TRACKS[name]) {
    var d = decks[0] === old ? decks[1] : decks[0];
    d.name = name; d.el.loop = TRACKS[name].loop; d.el.src = import.meta.env.BASE_URL + 'music/' + TRACKS[name].file;
    var p = d.el.play(); if (p && p.catch) p.catch(function () {});
    fadeTo(d, VOL * (TRACKS[name].gain || 1)); cur = d;
  }
  listeners.forEach(function (fn) { fn(name); });
}
export function playing() { return cur ? cur.name : null; }
export function playingElement() { return cur ? cur.el : null; } // for checks in the dev tools
export function masterVolume() { return master ? master.gain.value : null; } // idem
export function onMusic(fn) { listeners.push(fn); }
export function setMusicMuted(m) { if (master) master.gain.setTargetAtTime(m ? 0 : 1, ac.currentTime, 0.05); }

// Pause when the page is hidden (phone locked, other app), carry on when it comes back.
document.addEventListener('visibilitychange', function () {
  if (!cur) return;
  if (document.hidden) cur.el.pause();
  else { try { if (ac.state === 'suspended') ac.resume(); } catch (e) {} var p = cur.el.play(); if (p && p.catch) p.catch(function () {}); }
});
