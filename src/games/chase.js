import * as THREE from 'three';
import { $, phone } from '../core/dom.js';
import { W, H, COL, st, fx } from '../core/state.js';
import { beep } from '../core/audio.js';
import { save, recordBest } from '../core/save.js';
import { ok, view, toon, outline } from '../core/render.js';
import { say, talk, choose, hint, floatText, wipeThen, startFlash } from '../ui/dialog.js';
import { makeTuft } from '../world/grass.js';
import { eggGeo, eggMat, blob } from '../world/stage.js';
import { raccoon } from './raccoon.js';
import { rnd, mkTree, fmats, eggLow } from './runner.js';
import { setScreen, arcadeBack } from '../core/nav.js';
import { S } from '../strings.en.js';
import { PTS, EHG } from '../world/stage.js';

// The chase world is its own scene: three lanes, scrolling toward the camera.
var chaseScene, chaseCam, chaseTex = [], chaseDeco = [], chaseObs = [], chaseParts = [], cEggOut, cEggIn, cBlob, cRac;
if (ok) {
  // ---------- raccoon chase world (its own scene, scrolls toward the camera) ----------
  chaseScene = new THREE.Scene(); chaseScene.background = new THREE.Color(COL.sky); chaseScene.fog = new THREE.Fog(COL.sky, 16, 56);
  chaseScene.add(new THREE.AmbientLight(0xffffff, 0.5)); var csun = new THREE.DirectionalLight(0xffffff, 0.5); csun.position.set(-4, 8, 6); chaseScene.add(csun);
  chaseCam = new THREE.PerspectiveCamera(60, W / H, 0.1, 120);
  var mkTex = function (base, cols, n, rep) {
    var c = document.createElement('canvas'); c.width = c.height = 16; var x = c.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, 16, 16);
    for (var i = 0; i < n; i++) { x.fillStyle = cols[i % cols.length]; x.fillRect(Math.floor(rnd() * 16), Math.floor(rnd() * 16), 1, 1); }
    var t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t;
  };
  chaseTex = [mkTex('#b9d29f', ['#a6c48c', '#c9ddb0'], 16, [24, 30]), mkTex('#e9dcb2', ['#d9c99a', '#f3e9c8', '#c9b98a'], 14, [3, 30])];
  var cgr = new THREE.Mesh(new THREE.PlaneGeometry(60, 116, 6, 24), toon(0xffffff, chaseTex[0])); cgr.rotation.x = -Math.PI / 2; cgr.position.set(0, 0, -52); chaseScene.add(cgr);
  var cpa = new THREE.Mesh(new THREE.PlaneGeometry(5.9, 116, 1, 24), toon(0xffffff, chaseTex[1])); cpa.rotation.x = -Math.PI / 2; cpa.position.set(0, 0.01, -52); chaseScene.add(cpa);
  [-2.98, 2.98].forEach(function (x) { var ce = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 116, 1, 24), toon(COL.sageD)); ce.rotation.x = -Math.PI / 2; ce.position.set(x, 0.02, -52); chaseScene.add(ce); });
  for (var ct = 0; ct < 22; ct++) { var cside = ct % 2 ? 1 : -1; chaseDeco.push(mkTree(cside * (4.4 + rnd() * 3.5), 4 - ct * 3.82, 1.5 + rnd() * 1.1, chaseScene)); }
  for (var cf = 0; cf < 28; cf++) { var cfl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), fmats[Math.floor(rnd() * 4)]); cfl.position.set((cf % 2 ? 1 : -1) * (3.2 + rnd() * 2.5), 0.09, 4 - cf * 3); chaseScene.add(cfl); chaseDeco.push(cfl); }
  for (var cu = 0; cu < 24; cu++) { var ctf = makeTuft(4, 0.8 + rnd() * 0.3); ctf.position.set((cu % 2 ? 1 : -1) * (3.2 + rnd() * 1.6), 0, 4 - cu * 3.5); chaseScene.add(ctf); chaseDeco.push(ctf); }
  var mkChaseObs = function (type) {
    var g = new THREE.Group(), h = 0, d = 0.8;
    if (type === 'log') { var lg3 = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 10), toon(0xb68b6a)), 1.06); lg3.rotation.z = Math.PI / 2; lg3.position.y = 0.4; g.add(lg3); h = 0.8; }
    if (type === 'trunk') { var tk = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 5.9, 12), toon(0xa27a5c)), 1.04); tk.rotation.z = Math.PI / 2; tk.position.y = 0.42; g.add(tk); h = 0.85; }
    if (type === 'rock') { var rk = outline(new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), toon(0xa9a1bd)), 1.06); rk.scale.set(1, 1.2, 0.85); rk.position.y = 0.9; g.add(rk); h = 9; d = 1.2; }
    if (type === 'branch') {
      [-2.9, 2.9].forEach(function (x) { var po = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.1, 6), toon(0xb68b6a)), 1.1); po.position.set(x, 1.05, 0); g.add(po); });
      var bar = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 6.2, 8), toon(0x9c7558)), 1.06); bar.rotation.z = Math.PI / 2; bar.position.y = 1.6; g.add(bar);
      for (var lv = 0; lv < 6; lv++) { var leaf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), toon(lv % 2 ? 0x9cc79a : 0x7fae7a)); leaf.position.set(-2.4 + lv * 0.95, 1.85 + (lv % 2) * 0.12, 0); g.add(leaf); }
      h = 1.3; d = 0.5;
    }
    if (type === 'puddle') { var pd2 = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.04, 14), toon(0x8a6a55)); pd2.scale.z = 1.4; pd2.position.y = 0.03; g.add(pd2); d = 1.8; }
    if (type === 'seed') { var sd2 = outline(new THREE.Mesh(new THREE.OctahedronGeometry(0.22), toon(COL.butter)), 1.15); sd2.position.y = 0.6; g.add(sd2); d = 0.5; }
    g.visible = false; chaseScene.add(g);
    chaseObs.push({ g: g, type: type, h: h, d: d, lanes: [0], on: false, hit: false, vx: 0, vy: 0, spin: 0 });
  };
  [['log', 8], ['trunk', 3], ['rock', 8], ['branch', 3], ['puddle', 4], ['seed', 24]].forEach(function (p) { for (var pi = 0; pi < p[1]; pi++) mkChaseObs(p[0]); });
  cEggOut = new THREE.Group(); cEggIn = new THREE.Group(); cEggIn.add(outline(new THREE.Mesh(eggGeo, eggMat), 1.045)); cEggIn.scale.setScalar(0.7); cEggOut.add(cEggIn); chaseScene.add(cEggOut);
  cBlob = new THREE.Mesh(new THREE.CircleGeometry(0.7, 14), blob.material); cBlob.rotation.x = -Math.PI / 2; cBlob.position.y = 0.03; chaseScene.add(cBlob);
  cRac = raccoon.clone(); cRac.visible = true; cRac.scale.setScalar(0.9); cRac.rotation.set(0, Math.PI / 2, 0); chaseScene.add(cRac);
  for (var cpp = 0; cpp < 14; cpp++) { var cpm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), new THREE.MeshBasicMaterial({ color: cpp % 2 ? 0x8a6a55 : COL.butter })); cpm.visible = false; chaseScene.add(cpm); chaseParts.push({ m: cpm, v: new THREE.Vector3(), t: 0 }); }
}
export { chaseScene, chaseCam, chaseObs };

// Mini game: raccoon chase (90%).
export var CH = { phase: 'off', lane: 1, x: 0, y: 0, vy: 0, rot: 0, v: 0, dist: 0, gap: 1, t: 0, duck: 0, seeds: 0, fails: 0, goal: 300, until: 0, slow: 0, sw: null, shake: 0, racX: 0 };
var LANES = [-1.8, 0, 1.8];
function eggHigh(th) {
  var sn = Math.sin(th), c = Math.cos(th), m = -1e9;
  for (var i = 0; i < PTS.length; i++) { var y = PTS[i].y - EHG / 2, a = PTS[i].x * sn; m = Math.max(m, a + y * c, -a + y * c); }
  return m * 0.7;
}
function chaseHud() { $('chdist').textContent = S.chase.dist(Math.floor(CH.dist)); var b = $('chbar'); b.style.width = Math.round((1 - CH.gap) * 100) + '%'; b.style.backgroundColor = CH.gap < 0.5 ? '#d97f7a' : '#e2b84f'; }
function chaseReset() {
  CH.lane = 1; CH.x = 0; CH.rot = 0; CH.y = eggLow(0); CH.vy = 0; CH.v = 0; CH.dist = 0; CH.gap = 0.22; CH.t = 0; CH.duck = 0; CH.seeds = 0; CH.until = 14; CH.slow = 0; CH.sw = null; CH.racX = 0;
  chaseObs.forEach(function (o) { o.on = false; o.hit = false; o.g.visible = false; o.g.rotation.set(0, 0, 0); o.g.position.y = 0; });
  chaseHud();
}
export function startChase() {
  CH.goal = st.arcade ? 1e9 : 300;
  phone.dataset.sp = 'wait'; $('dtext').textContent = ''; CH.phase = 'wait'; CH.fails = 0;
  [392, 392, 466, 523, 587].forEach(function (f, i) { beep(f, 0.09, 'square', 0.04, i * 0.1); });
  wipeThen(function () {
    if (st.screen !== 'chase' || !ok) return;
    view.scene = chaseScene; view.cam = chaseCam; chaseReset(); CH.phase = 'intro'; phone.dataset.sp = 'intro';
    talk(st.arcade ? S.chase.introArcade : S.chase.intro, chasePlay);
  });
}
function chasePlay() { CH.phase = 'play'; phone.dataset.sp = 'play'; hint(S.chase.hint); var r = phone.getBoundingClientRect(); floatText(S.common.go, r.width / 2, r.height * 0.35); beep(784, 0.1); }
function chaseFloat(t, bad) { var v = cEggOut.position.clone(); v.y += 1.8; v.project(chaseCam); var r = phone.getBoundingClientRect(); floatText(t, (v.x + 1) / 2 * r.width, (1 - v.y) / 2 * r.height, bad); }
export function chaseInput(dir) {
  if (CH.phase !== 'play') return;
  var grounded = CH.y <= eggLow(CH.rot) * (CH.duck > 0 ? 0.5 : 1) + 0.05;
  if (dir === 'left' && CH.lane > 0) { CH.lane--; beep(330, 0.03, 'square', 0.025); }
  if (dir === 'right' && CH.lane < 2) { CH.lane++; beep(330, 0.03, 'square', 0.025); }
  if (dir === 'up' && grounded) { CH.vy = 10.5; CH.duck = 0; beep(392, 0.05, 'square', 0.035); beep(587, 0.06, 'square', 0.035, 0.05); }
  if (dir === 'down') { CH.duck = 0.7; if (!grounded) CH.vy = -16; beep(196, 0.06, 'triangle', 0.04); }
}
function chaseGet(type) { for (var i = 0; i < chaseObs.length; i++) { var o = chaseObs[i]; if (o.type === type && !o.on) return o; } return null; }
function chasePlace(type, lanes, z) {
  var o = chaseGet(type); if (!o) return;
  o.on = true; o.hit = false; o.lanes = lanes; o.g.visible = true; o.g.rotation.set(0, 0, 0);
  o.g.position.set(lanes.length === 3 ? 0 : LANES[lanes[0]], 0, z);
}
function chaseRow() {
  var z = -56, d = CH.dist, r = Math.random();
  if (d > 40 && r < 0.15) { chasePlace('trunk', [0, 1, 2], z); return; }
  if (d > 90 && r < 0.28) { chasePlace('branch', [0, 1, 2], z); return; }
  var ln = [0, 1, 2].sort(function () { return Math.random() - 0.5; }), nb = (d > 110 && Math.random() < 0.45) ? 2 : 1;
  for (var i = 0; i < nb; i++) chasePlace(Math.random() < 0.55 ? 'rock' : 'log', [ln[i]], z);
  var free = ln[nb];
  if (Math.random() < 0.22) chasePlace('puddle', [free], z);
  else for (var k = 0; k < 3; k++) chasePlace('seed', [free], z - k * 1.6);
}
function chaseBurst(n, col) {
  var k = 0; chaseParts.forEach(function (p, i) { if (k >= n || p.t > 0) return; if (col && (i % 2 === 0) !== (col === 'seed')) return; k++; p.t = 0.5; p.m.visible = true; p.m.position.set(CH.x + (Math.random() - 0.5) * 0.8, 0.5 + Math.random() * 0.6, (Math.random() - 0.5) * 0.6); p.v.set((Math.random() - 0.5) * 4, 3 + Math.random() * 3, 2 + Math.random() * 3); });
}
function chaseStumble(o) {
  o.hit = true; o.vx = (o.g.position.x >= CH.x ? 1 : -1) * 5; o.vy = 6; o.spin = 8;
  CH.gap -= 0.5; CH.slow = 0.7; CH.shake = 0.4; st.wig = 1.4; chaseFloat(S.common.bonk, true); beep(120, 0.15, 'square', 0.05); beep(90, 0.15, 'square', 0.05, 0.08);
  if (CH.gap <= 0) chaseCaught();
}
function chaseCaught() {
  CH.gap = 0; CH.phase = 'caught'; phone.dataset.sp = 'end'; hint(''); CH.fails++;
  var f = $('flash'); f.classList.add('red'); startFlash(); setTimeout(function () { f.classList.remove('red'); }, 700);
  beep(110, 0.35, 'sawtooth', 0.06);
  var dist = Math.floor(CH.dist), nb = recordBest('chase', dist, true);
  if (st.arcade) {
    talk(S.chase.arcadeCaught(dist, nb, st.best.chase), function () {
      choose(S.common.again, [['retry', S.common.tryAgain], ['back', S.common.back]], function (k) { if (k === 'retry') { chaseReset(); chasePlay(); } else arcadeBack(); }, 1);
    });
    return;
  }
  talk(S.chase.caught, function () {
    var opts = [['retry', S.common.tryAgain]]; if (CH.fails >= 2) opts.push(['skip', S.common.skip]);
    choose(S.common.whatNow, opts, function (k) { if (k === 'retry') { chaseReset(); chasePlay(); } else chaseFinish(S.chase.afterSkip); }, 1);
  });
}
function chaseFinish(msg) { wipeThen(function () { if (st.screen !== 'chase') return; st.done.chase = true; save(true); setScreen('tap', false); say(msg); }); }
function chaseEscape() {
  CH.phase = 'escaped'; phone.dataset.sp = 'end'; hint(''); recordBest('chase', Math.floor(CH.dist), true);
  [523, 659, 784, 1047].forEach(function (f, i) { beep(f, 0.12, 'square', 0.04, i * 0.09); });
  talk(S.chase.escaped(CH.seeds), function () { chaseFinish(S.chase.afterEscape); });
}
export function chaseStep(dt) {
  if (CH.phase === 'off' || CH.phase === 'wait') return;
  var sy = CH.duck > 0 ? 0.5 : 1, mv = 0;
  if (CH.phase === 'play' || CH.phase === 'escaped') {
    CH.t += dt; CH.slow -= dt;
    CH.v = Math.min(14, 9 + CH.dist / 55) * (CH.slow > 0 ? 0.65 : 1) * (CH.phase === 'escaped' ? 0.6 : 1);
    mv = CH.v * dt; CH.dist += CH.phase === 'play' ? mv : 0;
    if (CH.phase === 'play') {
      CH.gap = Math.min(1, CH.gap + dt * 0.09);
      CH.until -= mv; if (CH.until <= 0) { chaseRow(); CH.until = Math.max(7, 12 - CH.dist / 60); }
      if (CH.dist >= CH.goal) chaseEscape();
    } else CH.gap = Math.min(1.6, CH.gap + dt * 0.6);
    chaseTex[0].offset.y += mv / 4; chaseTex[1].offset.y += mv / 4;
    chaseDeco.forEach(function (o) { o.position.z += mv; if (o.position.z > 5) o.position.z -= 84; });
  }
  CH.duck -= dt;
  CH.x += (LANES[CH.lane] - CH.x) * Math.min(1, dt * 14);
  CH.rot -= mv / 0.95;
  CH.vy -= 26 * dt; CH.y += CH.vy * dt;
  var gnd = eggLow(CH.rot) * sy; if (CH.y <= gnd) { CH.y = gnd; CH.vy = 0; }
  var bottom = CH.y - gnd, top = CH.y + eggHigh(CH.rot) * sy;
  chaseObs.forEach(function (o) {
    if (!o.on) return;
    o.g.position.z += mv;
    if (o.type === 'seed' && !o.hit) o.g.rotation.y += dt * 4;
    if (o.hit) {
      if (o.type === 'seed' || o.type === 'puddle') { if (o.type === 'seed') o.g.visible = false; }
      else { o.vy -= 20 * dt; o.g.position.x += o.vx * dt; o.g.position.y += o.vy * dt; o.g.rotation.z += o.spin * dt; }
      if (o.g.position.z > 9 || o.g.position.y < -3) { o.on = false; o.g.visible = false; }
      return;
    }
    if (o.g.position.z > 9) { o.on = false; o.g.visible = false; return; }
    if (CH.phase !== 'play' || Math.abs(o.g.position.z) > 0.5 + o.d / 2) return;
    if (o.lanes.length < 3 && Math.abs(LANES[o.lanes[0]] - CH.x) > 1.0) return;
    if (o.type === 'seed') { if (bottom < 1.4) { o.hit = true; CH.seeds++; CH.gap = Math.min(1, CH.gap + 0.05); chaseBurst(3, 'seed'); beep(1175 + (CH.seeds % 4) * 120, 0.04, 'square', 0.025); } return; }
    if (o.type === 'puddle') { if (bottom < 0.1) { o.hit = true; CH.slow = 0.6; CH.gap -= 0.12; chaseBurst(6, 'mud'); chaseFloat(S.common.splat, true); beep(160, 0.12, 'triangle', 0.06); } return; }
    if (o.type === 'branch') { if (top > o.h) chaseStumble(o); return; }
    if (bottom < o.h - 0.15) chaseStumble(o);
  });
  chaseParts.forEach(function (p) { if (p.t <= 0) return; p.t -= dt; p.v.y -= 14 * dt; p.m.position.addScaledVector(p.v, dt); if (p.t <= 0) p.m.visible = false; });
  cEggOut.position.set(CH.x, CH.y, 0); cEggOut.scale.set(sy < 1 ? 1.25 : 1, sy, sy < 1 ? 1.25 : 1); cEggIn.rotation.x = CH.rot;
  cBlob.position.x = CH.x; cBlob.scale.setScalar(Math.max(0.4, 1 - bottom * 0.25));
  CH.racX += (CH.x * 0.8 - CH.racX) * Math.min(1, dt * 3);
  var rz = CH.phase === 'caught' ? 1.6 : 1.6 + CH.gap * 9;
  cRac.position.set(CH.racX, Math.abs(Math.sin(fx.clock * 12)) * 0.3, rz); cRac.rotation.z = CH.phase === 'escaped' && CH.gap > 1 ? Math.min(1.4, (CH.gap - 1) * 3) : Math.sin(fx.clock * 12) * 0.06;
  CH.shake *= Math.pow(0.002, dt);
  chaseCam.position.set(CH.x * 0.45 + (Math.random() - 0.5) * CH.shake, 4.3 + (Math.random() - 0.5) * CH.shake, 7.6);
  chaseCam.lookAt(CH.x * 0.3, 0.6, -9);
  chaseHud();
}
