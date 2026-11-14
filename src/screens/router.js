import { $, phone } from '../core/dom.js';
import { st, evTap, setDoneBy } from '../core/state.js';
import { save } from '../core/save.js';
import { beep } from '../core/audio.js';
import { ok, scene, camera, view, camGo } from '../core/render.js';
import { say, hint, resetDialog } from '../ui/dialog.js';
import { hud } from '../ui/hud.js';
import { mud, trees, shards, paintEgg, showEgg, showHero, setStage } from '../world/stage.js';
import { snakeReset, startSnake } from '../games/snakes.js';
import { raccoon, racPad, EN, startEnc } from '../games/raccoon.js';
import { RN, startRun } from '../games/runner.js';
import { CH, startChase } from '../games/chase.js';
import { CL, makeMud, startClean, showerG, bubbles, drops } from '../games/mudwash.js';
import { renderLib } from './home.js';
import { msgFor } from './tap.js';
import { bindNav } from '../core/nav.js';
import { play } from '../core/music.js';
import { GIFT } from '../config.js';
import { S } from '../strings.en.js';

// Which track each screen plays (core/music.js). null = silence.
const MUSIC = { cont: null, start: 'town', tap: 'town', snake: 'upbeat', run: 'upbeat', clean: 'town', enc: 'wild', chase: 'trainer', error: null, hatch: null, gift: 'upbeat', lib: 'upbeat' };

// The dev panel hooks in here to highlight the active tab. Nothing else uses it.
export const hooks = { onScreen: null };

export function arcadeBack() { st.arcade = null; setScreen('lib'); }

export function setScreen(n, demo) {
  var prev = st.screen;
  if (prev === 'error' && n !== 'error') st.afterError = false; // left the fake error without reloading
  if (['snake', 'run', 'enc', 'clean', 'chase'].indexOf(n) < 0) st.arcade = null;
  $('cardview').classList.remove('show');
  st.screen = n; phone.dataset.screen = n; phone.dataset.sp = '';
  resetDialog(); EN.phase = 'off';
  if (ok) { snakeReset(); raccoon.visible = false; racPad.visible = false; trees.forEach(function (t) { t.visible = true; }); }
  RN.phase = 'off'; CH.phase = 'off'; CH.sw = null; CL.phase = 'off'; CL.down = false; mud.on = false; hint(''); $('tool').dataset.t = 'none';
  if (ok) { view.scene = scene; view.cam = camera; showerG.visible = false; bubbles.forEach(function (b) { b.m.visible = false; }); drops.forEach(function (d) { d.m.visible = false; }); }
  camGo('front', (prev === 'snake' || prev === 'enc') ? 1.2 : 0.5);
  if (hooks.onScreen) hooks.onScreen(n);
  $('card').classList.remove('zoom');
  $('prompt').textContent = '';
  st.hatchT = -1;
  if (ok) { shards.forEach(function (s) { s.m.visible = false; }); }
  // music: the hatch starts silent (the rap comes in on the flash, see hatch.js); home and library
  // let a running rap finish before the home music takes over; the fake error cuts everything
  play(MUSIC[n] === undefined ? null : MUSIC[n], (n === 'gift' || n === 'lib') ? 'rap' : null);
  if (n === 'cont') {
    // TAP TO CONTINUE (returning visits): the egg, or him if he has hatched; silent until the tap
    showEgg(!st.unlocked); showHero(st.unlocked, 1); if (!st.unlocked) setStage(true); say(st.unlocked ? S.cont.hatched(GIFT.name) : S.cont.egg); $('prompt').textContent = S.cont.prompt;
  } else if (n === 'start') {
    if (demo !== false) { st.taps = 0; st.errorShown = false; st.done = {}; }
    showEgg(true); showHero(false); setStage(true); say(S.start.intro); $('prompt').textContent = S.start.prompt;
  } else if (n === 'tap') {
    if (demo && (st.taps < 100 || st.taps >= st.errorAt)) { st.taps = Math.round(st.total * 0.41); st.errorShown = false; }
    if (demo) setDoneBy(st.taps, true);
    showEgg(true); showHero(false); setStage(true); hud(); say(msgFor(st.taps));
  } else if (n === 'error') {
    // afterError is set the moment the error shows, not only on the REFRESH button: a real browser
    // refresh (or closing the app) must also come back to "Just kidding!"
    st.taps = st.errorAt; st.errorShown = true; st.afterError = true; save(true); setDoneBy(st.taps, true); hud(); showEgg(true); showHero(false); setStage(true); beep(110, 0.25, 'sawtooth', 0.05); beep(82, 0.35, 'sawtooth', 0.05, 0.2);
  } else if (n === 'hatch') {
    st.taps = st.total; st.stage = 4; if (ok) paintEgg(4); showEgg(true); showHero(false); st.hatchT = 0; st.step = 0; say(S.hatch.start);
  } else if (n === 'preview') {
    showEgg(false); // the /make preview: screens/preview.js puts the character and camera in place
  } else if (n === 'gift') {
    showEgg(false); showHero(true, 1); camGo('gift');
  } else if (n === 'lib') {
    showEgg(false); showHero(true, 1); camGo('gift'); renderLib();
  } else if (n === 'snake') {
    if (demo) { st.taps = evTap('snake'); setDoneBy(st.taps, false); st.errorShown = false; }
    showEgg(true); showHero(false); setStage(true); hud(); startSnake();
  } else if (n === 'enc') {
    if (demo) { st.taps = evTap('enc'); setDoneBy(st.taps, false); st.errorShown = false; }
    showEgg(true); showHero(false); setStage(true); hud(); startEnc();
  } else if (n === 'run') {
    if (demo) { st.taps = evTap('run'); setDoneBy(st.taps, false); st.errorShown = false; }
    showEgg(true); showHero(false); setStage(true); hud(); startRun();
  } else if (n === 'chase') {
    if (demo) { st.taps = evTap('chase'); setDoneBy(st.taps, false); st.errorShown = false; }
    showEgg(true); showHero(false); setStage(true); hud(); startChase();
  } else if (n === 'clean') {
    if (demo) { st.taps = evTap('clean'); setDoneBy(st.taps, false); st.errorShown = false; }
    showEgg(true); showHero(false); makeMud(); mud.on = true; setStage(true); hud(); startClean();
  }
}

bindNav({ setScreen: setScreen, arcadeBack: arcadeBack });
