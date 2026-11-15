import './fonts/pixel.css';
import './style.css';
import { st, fx, pendingEvent, setTotal } from './core/state.js';
import { loadSave, save, useSaveKey } from './core/save.js';
import { initLayout } from './core/layout.js';
import { ok, renderer, view, cameraStep } from './core/render.js';
import { setMuted } from './ui/hud.js';
import { say } from './ui/dialog.js';
import { initInput } from './ui/input.js';
import { stageStep, trees, setGiftFace, loadFacePng } from './world/stage.js';
import { setScreen } from './screens/router.js';
import { hatchStep } from './screens/hatch.js';
import { startPreview, previewStep } from './screens/preview.js';
import { SN, snakeStep, cullTrees } from './games/snakes.js';
import { runStep, runScene, runCam } from './games/runner.js';
import { chaseStep, chaseScene, chaseCam } from './games/chase.js';
import { CL, cleanStep } from './games/mudwash.js';
import { encStep } from './games/raccoon.js';
import { GIFT } from './config.js';
import { loadGift } from './gift/load.js';
import { S } from './strings.en.js';

// Fill every [data-str] / [data-aria] / [data-alt] element in index.html from strings.en.js.
function lookup(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, S); }
function applyStrings() {
  document.querySelectorAll('[data-str]').forEach(function (el) { el.textContent = lookup(el.dataset.str); });
  document.querySelectorAll('[data-aria]').forEach(function (el) { el.setAttribute('aria-label', lookup(el.dataset.aria)); });
  document.querySelectorAll('[data-alt]').forEach(function (el) { el.setAttribute('alt', lookup(el.dataset.alt)); });
}

// Boot order: a pending "Just kidding!", then the finished state, then a half-finished story.
// Returning visits wait for one tap (TAP TO CONTINUE): browsers only allow sound after a tap,
// so the game and its music start together instead of the music arriving with the first egg tap.
function later(fn) { st.contNext = fn; setScreen('cont'); }

function boot() {
  var sv = loadSave();
  if (sv) {
    // The total always comes from the gift. A save made under another total keeps its percentage
    // instead of its raw taps, so the done flags, cracks and fake error stay in step.
    // Floor so rounding never crosses an event.
    var oldTotal = sv.total || st.total, taps = sv.taps || 0;
    if (oldTotal !== st.total) taps = Math.min(st.total, Math.floor(taps * st.total / oldTotal));
    st.taps = taps; st.done = sv.done || {};
    st.errorShown = !!sv.errorShown; st.unlocked = !!sv.unlocked; st.best = sv.best || {}; if (sv.muted) setMuted(true);
  }
  // REFRESH on the fake error comes first: after a START OVER the gift stays unlocked, and the
  // "Just kidding!" must still land instead of jumping to the gift
  if (sv && sv.afterError) { later(function () { st.afterError = false; save(true); setScreen('tap', false); say(S.error.kidding); }); return; }
  if (st.unlocked) { later(function () { setScreen('gift'); }); return; }
  if (sv && st.taps > 0) { var pe = pendingEvent(); later(function () { if (pe) setScreen(pe); else { setScreen('tap', false); say(S.welcomeBack(st.total - st.taps)); } }); return; }
  setScreen('start', false);
}

var last = performance.now();
function frame(now) {
  var dt = Math.min(0.05, (now - last) / 1000); last = now; fx.clock += dt;
  if (ok) {
    hatchStep(dt);
    stageStep(dt);
    if (SN.phase !== 'off') snakeStep(dt);
    runStep(dt);
    chaseStep(dt);
    if (CL.phase !== 'off') cleanStep(dt);
    encStep(dt);
    previewStep();
    cameraStep(dt);
    renderer.render(view.scene, view.cam);
    cullTrees(trees);
  }
  requestAnimationFrame(frame);
}

applyStrings();
initLayout();
initInput();
// Compile the runner and chase scenes now so switching to them does not stutter.
if (ok) { try { renderer.compile(runScene, runCam); renderer.compile(chaseScene, chaseCam); } catch (e) {} }
requestAnimationFrame(frame);

// Which egg is this? (gift link, /make preview, or the own/demo egg from config.js)
loadGift().then(function (mode) {
  setTotal(GIFT.taps); useSaveKey(GIFT.id);
  if (mode === 'preview') { startPreview(); return; }
  if (GIFT.face) setGiftFace(GIFT.face, GIFT.tone); else loadFacePng();
  if (mode === 'broken') { setScreen('start', false); say(S.broken); return; }
  boot();
});
// Opening a different gift link in the same tab: start fresh with that one.
window.addEventListener('hashchange', function () { location.reload(); });

// Dev tools never ship: import.meta.env.DEV is false in the production build, so this branch is removed.
if (import.meta.env.DEV && !/[?&]preview\b/.test(location.search)) {
  import('./dev/panel.js').then(function (m) { m.initDevPanel(); });
}
