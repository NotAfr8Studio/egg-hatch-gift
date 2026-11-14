import './dev.css';
import { phone } from '../core/dom.js';
import { st, EVENTS, evTap } from '../core/state.js';
import { audio, beep } from '../core/audio.js';
import { save, clearSave } from '../core/save.js';
import * as THREE from 'three';
import { scene, camera, setRes, ok } from '../core/render.js';
import { say } from '../ui/dialog.js';
import { hud } from '../ui/hud.js';
import { setScreen } from '../core/nav.js';
import { hooks } from '../screens/router.js';
import { tapEgg, msgFor } from '../screens/tap.js';
import { setStage } from '../world/stage.js';
import { runScene, RN, runObs } from '../games/runner.js';
import { SN, snakes } from '../games/snakes.js';
import { CH, chaseObs } from '../games/chase.js';
import { CL } from '../games/mudwash.js';
import { EN } from '../games/raccoon.js';
import { initFaceEditor, loadSavedFace, EDITOR_HTML } from './face-editor.js';

// Developer panel: jump to any screen, skip ahead, change totals, toggle styles, edit the face.
// Never shipped: it is only imported behind import.meta.env.DEV.
var PAL = [['Plum', '#2b2437'], ['Cream', '#f7efd6'], ['Sage', '#b9d29f'], ['Sky', '#cfe6e1'], ['Rose', '#e9a5a0'], ['Butter', '#f3d98b'], ['Teal', '#5f8f94'], ['Lavender', '#a99ac7']];

var PANEL_HTML = "<button id=\"devtoggle\" type=\"button\" aria-label=\"Dev panel\">DEV</button>\n<aside id=\"devdrawer\" hidden>\n<nav class=\"tabs\" aria-label=\"Screens\" id=\"tabs\">\n    <button class=\"tab\" data-go=\"start\" aria-pressed=\"true\">1 Start</button>\n    <button class=\"tab\" data-go=\"tap\" aria-pressed=\"false\">2 Tapping</button>\n    <button class=\"tab\" data-go=\"snake\" aria-pressed=\"false\">3 Snakes (20%)</button>\n    <button class=\"tab\" data-go=\"run\" aria-pressed=\"false\">4 Rolling run (40%)</button>\n    <button class=\"tab\" data-go=\"enc\" aria-pressed=\"false\">5 Raccoon (60%)</button>\n    <button class=\"tab\" data-go=\"clean\" aria-pressed=\"false\">6 Mud wash (80%)</button>\n    <button class=\"tab\" data-go=\"chase\" aria-pressed=\"false\">7 Raccoon chase (90%)</button>\n    <button class=\"tab\" data-go=\"error\" aria-pressed=\"false\">8 Fake error (95%)</button>\n    <button class=\"tab\" data-go=\"hatch\" aria-pressed=\"false\">9 Hatch</button>\n    <button class=\"tab\" data-go=\"gift\" aria-pressed=\"false\">10 Gift</button>\n    <button class=\"tab\" data-go=\"quiz\" aria-pressed=\"false\">Pop quiz (30%)</button>\n</nav>\n<div class=\"opts\">\n    <section class=\"group\">\n      <h2>Text style</h2>\n      <div class=\"row\" id=\"hudstyle\">\n        <button class=\"chip\" data-hud=\"outline\" aria-pressed=\"true\">Outline</button>\n        <button class=\"chip\" data-hud=\"box\" aria-pressed=\"false\">Cream box</button>\n      </div>\n      <div class=\"row\" id=\"hazerow\">\n        <button class=\"chip\" data-haze=\"1\" aria-pressed=\"true\">Background haze on</button>\n        <button class=\"chip\" data-haze=\"0\" aria-pressed=\"false\">Haze off</button>\n      </div>\n      <p>Outline keeps the floating look with a thin pixel border around the text. Haze fades distant trees into the sky, so text and characters stand out.</p>\n    </section>\n    <section class=\"group\">\n      <h2>Pixel size</h2>\n      <div class=\"row\" id=\"res\">\n        <button class=\"chip\" data-res=\"0.5\" aria-pressed=\"false\">Chunky</button>\n        <button class=\"chip\" data-res=\"1\" aria-pressed=\"true\">Medium</button>\n        <button class=\"chip\" data-res=\"2\" aria-pressed=\"false\">Fine</button>\n      </div>\n      <p>Changes how coarse the 3D is. The interface keeps its own pixel grid.</p>\n    </section>\n    <section class=\"group\">\n      <h2>Try a face</h2>\n      <div class=\"row\">\n        <button class=\"act\" id=\"pick\">Upload a photo</button>\n        <button class=\"act quiet\" id=\"resetface\">Use placeholder</button>\n        <input type=\"file\" id=\"file\" accept=\"image/*\">\n      </div>\n      <p>Pick any photo, frame the face, then remove the background. The cutout is stretched over the face area of the hatchling (128 pixels; a 1.2 : 1 crop looks right). It stays on your device and, in dev, overrides the gift face until you press Use placeholder.</p>\n    </section>\n    <section class=\"group\">\n      <h2>Total taps</h2>\n      <div class=\"row\" id=\"tot\">\n        <button class=\"chip\" data-total=\"1000\" aria-pressed=\"false\">1,000</button>\n        <button class=\"chip\" data-total=\"3000\" aria-pressed=\"false\">3,000</button>\n        <button class=\"chip\" data-total=\"4000\" aria-pressed=\"true\">4,000</button>\n      </div>\n      <div class=\"row\"><button class=\"act quiet\" id=\"plus\">+10% taps</button><button class=\"act quiet\" id=\"resetsave\">Reset all saved progress</button></div>\n      <p>Mini games at 20, 40, 60, 80 and 90%, a pop quiz at 30%, the fake error at 95% and the hatch at 100%. Messages come every 5%.</p>\n      <p>Progress saves on this device. Reloading resumes where you were, and after the hatch the page opens on the gift.</p>\n    </section>\n    <section class=\"group\">\n      <h2>Palette</h2>\n      <div class=\"swatches\" id=\"sw\"></div>\n      <p>Screen grid: 144 by 288 pixels. Three toon bands, dark plum outline, font Press Start 2P.</p>\n    </section>\n</div>\n</aside>\n__EDITOR__";

export function initDevPanel() {
  var root = document.createElement('div'); root.id = 'dev';
  root.innerHTML = PANEL_HTML.replace('__EDITOR__', EDITOR_HTML);
  document.body.appendChild(root);
  var $ = function (id) { return document.getElementById(id); };
  var drawer = $('devdrawer');
  $('devtoggle').addEventListener('click', function () { drawer.hidden = !drawer.hidden; });
  window.addEventListener('keydown', function (e) { if (e.key === '`' || e.key === '~') drawer.hidden = !drawer.hidden; });

  PAL.forEach(function (p) { var d = document.createElement('div'); d.className = 'sw'; d.innerHTML = '<i style="background:' + p[1] + '"></i>' + p[0] + '<br>' + p[1]; $('sw').appendChild(d); });

  // highlight the active screen tab
  hooks.onScreen = function (n) { document.querySelectorAll('#tabs .tab').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.go === n ? 'true' : 'false'); }); };
  hooks.onScreen(st.screen);

  document.querySelectorAll('#tabs .tab').forEach(function (b) { b.addEventListener('click', function () {
    audio(); st.arcade = null;
    if (b.dataset.go === 'quiz') { setScreen('tap', true); st.taps = Math.round(st.total * 0.3) - 1; st.done.quiz = false; hud(); tapEgg(); return; }
    setScreen(b.dataset.go, true);
  }); });

  document.querySelectorAll('#hudstyle .chip').forEach(function (b) {
    b.addEventListener('click', function () { document.querySelectorAll('#hudstyle .chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); }); phone.dataset.hud = b.dataset.hud; });
  });
  var fogs = ok ? [scene.fog, runScene.fog] : [];
  document.querySelectorAll('#hazerow .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#hazerow .chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      if (!ok) return; var on = b.dataset.haze === '1';
      scene.fog = on ? fogs[0] : null; runScene.fog = on ? fogs[1] : null;
      [scene, runScene].forEach(function (sc) { sc.traverse(function (o) { if (o.material) o.material.needsUpdate = true; }); });
    });
  });
  document.querySelectorAll('#res .chip').forEach(function (b) {
    b.addEventListener('click', function () { document.querySelectorAll('#res .chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); }); if (ok) setRes(parseFloat(b.dataset.res)); });
  });
  $('plus').addEventListener('click', function () {
    audio();
    if (st.screen !== 'tap') setScreen('tap', true);
    var stops = [st.total];
    EVENTS.forEach(function (e) { if (!st.done[e[0]]) stops.push(evTap(e[0])); }); if (!st.errorShown) stops.push(st.errorAt);
    var cap = Math.min.apply(null, stops.filter(function (x) { return x > st.taps; }).concat([st.total])) - 1;
    if (cap <= st.taps) { tapEgg(); return; }
    st.taps = Math.min(cap, st.taps + Math.round(st.total / 10)); hud(); setStage(); st.wig = 1; say(msgFor(st.taps)); beep(440, 0.1);
  });
  document.querySelectorAll('#tot .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#tot .chip').forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
      st.total = parseInt(b.dataset.total, 10); st.errorAt = Math.round(st.total * 0.95); st.errorShown = false; st.done = {};
      st.taps = 0; save(true); setScreen(st.screen === 'start' ? 'start' : 'tap', true);
    });
  });
  $('resetsave').addEventListener('click', function () {
    clearSave();
    st.taps = 0; st.done = {}; st.errorShown = false; st.unlocked = false; st.best = {}; st.afterError = false; setScreen('start', true);
  });

  function syncTotalChips() { document.querySelectorAll('#tot .chip').forEach(function (c) { c.setAttribute('aria-pressed', parseInt(c.dataset.total, 10) === st.total ? 'true' : 'false'); }); }
  syncTotalChips();

  initFaceEditor();
  loadSavedFace();

  // handy for poking at the game from the browser console while developing
  window.__hatch = { st: st, setScreen: setScreen, SN: SN, RN: RN, CH: CH, CL: CL, EN: EN, snakes: snakes, runObs: runObs, chaseObs: chaseObs };
  // screen positions of live snakes, for test bots
  window.__hatch.snakePos = function () {
    var r = $('gl').getBoundingClientRect(), v = new THREE.Vector3();
    return snakes.filter(function (s) { return s.state === 'in'; }).map(function (s) { v.copy(s.segs[0].position).project(camera); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; });
  };
}
