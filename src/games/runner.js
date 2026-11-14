import * as THREE from 'three';
import { $, phone } from '../core/dom.js';
import { W, H, COL, st, fx } from '../core/state.js';
import { beep } from '../core/audio.js';
import { save, recordBest } from '../core/save.js';
import { ok, view, toon, outline } from '../core/render.js';
import { say, talk, hint, floatText, wipeThen } from '../ui/dialog.js';
import { makeTuft } from '../world/grass.js';
import { eggGeo, eggMat, blob, PTS, EHG } from '../world/stage.js';
import { setScreen, arcadeBack } from '../core/nav.js';
import { S } from '../strings.en.js';

// A tiny seeded random generator so the runner and chase worlds look the same on every device.
var seed = 11;
export var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// The runner world is its own scene: side view, real parallax from hills, trees and clouds.
var runScene, runCam, rEgg, rBlob, runObs = [], runParts = [], mkTree, fmats;
if (ok) {
  // ---------- runner world (its own scene) ----------
    var RL = 220;
  runScene = new THREE.Scene(); runScene.background = new THREE.Color(COL.sky); runScene.fog = new THREE.Fog(COL.sky, 24, 95);
  runScene.add(new THREE.AmbientLight(0xffffff, 0.5)); var rsun = new THREE.DirectionalLight(0xffffff, 0.5); rsun.position.set(-4, 8, 6); runScene.add(rsun);
  runCam = new THREE.PerspectiveCamera(34, W / H, 0.1, 300);
  var rgnd = new THREE.Mesh(new THREE.PlaneGeometry(RL + 160, 100), toon(COL.sage)); rgnd.rotation.x = -Math.PI / 2; rgnd.position.set(RL / 2, 0, -15); runScene.add(rgnd);
  var rpath = new THREE.Mesh(new THREE.PlaneGeometry(RL + 160, 2.6), toon(0xe9dcb2)); rpath.rotation.x = -Math.PI / 2; rpath.position.set(RL / 2, 0.01, 0); runScene.add(rpath);
  [-1.35, 1.35].forEach(function (z) { var ed = new THREE.Mesh(new THREE.PlaneGeometry(RL + 160, 0.16), toon(COL.sageD)); ed.rotation.x = -Math.PI / 2; ed.position.set(RL / 2, 0.02, z); runScene.add(ed); });
  for (var hx = -40; hx < RL + 70; hx += 16 + rnd() * 12) {
    var hr = 8 + rnd() * 8, hill = new THREE.Mesh(new THREE.SphereGeometry(hr, 14, 8), toon(rnd() < 0.5 ? 0xa9cf9f : 0xc3dcae));
    hill.scale.y = 0.65; hill.position.set(hx, -hr * 0.2, -42 - rnd() * 10); runScene.add(hill);
  }
  for (var cx2 = -30; cx2 < RL + 70; cx2 += 18 + rnd() * 16) {
    var cg = new THREE.Group(); cg.position.set(cx2, 13 + rnd() * 5, -34);
    for (var cb = 0; cb < 3; cb++) { var cm = new THREE.Mesh(new THREE.BoxGeometry(2.4 - cb * 0.5, 1.1 - cb * 0.2, 1), new THREE.MeshBasicMaterial({ color: 0xfaf6ea, fog: false })); cm.position.set(cb * 1.3 - 1.2, cb === 1 ? 0.45 : 0, 0); cg.add(cm); }
    runScene.add(cg);
  }
  mkTree = function (x, z, sc, target) {
    var tg = new THREE.Group();
    var trunk = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 6), toon(0xb68b6a)), 1.1); trunk.position.y = 0.35; tg.add(trunk);
    for (var k = 0; k < 3; k++) { var cone = outline(new THREE.Mesh(new THREE.ConeGeometry(0.95 - k * 0.22, 0.95, 7), toon(k === 1 ? 0x9cc79a : 0xa9d3a0)), 1.06); cone.position.y = 1.0 + k * 0.62; tg.add(cone); }
    tg.position.set(x, 0, z); tg.scale.setScalar(sc); (target || runScene).add(tg); return tg;
  };
  for (var tx = -14; tx < RL + 40; tx += 6 + rnd() * 8) mkTree(tx, -9 - rnd() * 14, 2.4 + rnd() * 1.4);
  fmats = [toon(COL.rose), toon(COL.butter), toon(0xffffff), toon(COL.blue)];
  for (var fxp = -10; fxp < RL + 30; fxp += 1.2 + rnd() * 2) { var ff = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), fmats[Math.floor(rnd() * 4)]); ff.position.set(fxp, 0.1, (rnd() < 0.5 ? -1 : 1) * (1.7 + rnd() * 1.5)); runScene.add(ff); }
  for (var gx = -10; gx < RL + 30; gx += 2 + rnd() * 3) {
    var gt = makeTuft(5, 0.85 + rnd() * 0.3); gt.position.set(gx, 0, 3 + rnd() * 5); runScene.add(gt);
  }
  // finish: checker line, flag, nest
  var chk = document.createElement('canvas'); chk.width = 8; chk.height = 8; var chx = chk.getContext('2d');
  for (var cy2 = 0; cy2 < 8; cy2++) for (var cx3 = 0; cx3 < 8; cx3++) { chx.fillStyle = (cx3 + cy2) % 2 ? '#2b2437' : '#f7efd6'; chx.fillRect(cx3, cy2, 1, 1); }
  var chkTex = new THREE.CanvasTexture(chk); chkTex.magFilter = chkTex.minFilter = THREE.NearestFilter; chkTex.generateMipmaps = false;
  var fline = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.6), new THREE.MeshBasicMaterial({ map: chkTex })); fline.rotation.x = -Math.PI / 2; fline.position.set(RL, 0.03, 0); runScene.add(fline);
  var pole = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.4, 6), toon(COL.cream)), 1.2); pole.position.set(RL, 2.2, -1.8); runScene.add(pole);
  var flagT = chkTex.clone(); flagT.needsUpdate = true; flagT.repeat.set(1, 0.6);
  var flag = outline(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.05), new THREE.MeshBasicMaterial({ map: flagT })), 1.04); flag.position.set(RL + 0.85, 3.85, -1.8); runScene.add(flag);
  var nest = new THREE.Group(); nest.position.set(RL + 6, 0, 0); runScene.add(nest);
  var ring = outline(new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.32, 6, 14), toon(0xb68b6a)), 1.06); ring.rotation.x = Math.PI / 2; ring.position.y = 0.28; nest.add(ring);
  for (var tw = 0; tw < 9; tw++) { var twig = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), toon(0x8f6b52)); var ta = tw / 9 * Math.PI * 2; twig.position.set(Math.cos(ta) * 0.9, 0.45, Math.sin(ta) * 0.9); twig.rotation.y = -ta + 1.2; nest.add(twig); }
  // obstacles
  var mkObs = function (type, x) {
    var g = new THREE.Group(), w = 1, h = 0.7;
    if (type === 'rock') { var r1 = outline(new THREE.Mesh(new THREE.DodecahedronGeometry(0.5), toon(0xa9a1bd)), 1.08); r1.scale.set(1.1, 0.8, 0.9); r1.position.y = 0.36; g.add(r1); w = 1.05; h = 0.72; }
    if (type === 'mush') {
      var stem = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.6, 7), toon(COL.cream)), 1.12); stem.position.y = 0.3; g.add(stem);
      var cap = outline(new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon(COL.rose)), 1.06); cap.position.y = 0.55; g.add(cap);
      [[-0.2, 0.92, 0.3], [0.22, 0.85, 0.32], [0, 1.02, 0.05]].forEach(function (d) { var dt2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xffffff })); dt2.position.set(d[0], d[1], d[2]); g.add(dt2); });
      w = 1.0; h = 1.05;
    }
    if (type === 'log') { var lg2 = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.8, 10), toon(0xb68b6a)), 1.06); lg2.rotation.x = Math.PI / 2; lg2.position.y = 0.42; g.add(lg2); var endc = new THREE.Mesh(new THREE.CircleGeometry(0.3, 10), toon(0xe2c79a)); endc.position.set(0, 0.42, 0.91); g.add(endc); w = 0.84; h = 0.84; }
    if (type === 'snail') {
      var sb = outline(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 0.34), toon(0xd8c7a0)), 1.1); sb.position.y = 0.13; g.add(sb);
      var sh = outline(new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), toon(COL.butter)), 1.08); sh.position.set(0.12, 0.55, 0); g.add(sh);
      var sh2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), toon(COL.rose)); sh2.position.set(0.12, 0.58, 0.32); g.add(sh2);
      [-0.1, 0.1].forEach(function (z) { var stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 4), toon(0xd8c7a0)); stalk.position.set(-0.45, 0.4, z); g.add(stalk); var ey = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: COL.ink })); ey.position.set(-0.45, 0.6, z); g.add(ey); });
      w = 1.0; h = 0.95;
    }
    if (type === 'puddle') { var pd = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.04, 14), toon(0x8a6a55)); pd.scale.z = 0.6; pd.position.y = 0.03; g.add(pd); w = 1.9; h = 0; }
    g.position.set(x, 0, 0); runScene.add(g);
    runObs.push({ g: g, type: type, x0: x, w: w, h: h, hit: false, splat: false, vx: 0, vy: 0, spin: 0 });
  };
  var types = ['rock', 'mush', 'log', 'snail', 'puddle', 'rock', 'mush', 'log'];
  for (var ox = 16; ox < RL - 8; ox += 7 + rnd() * 5 - (ox / RL) * 1.5) mkObs(types[Math.floor(rnd() * types.length)], ox);
  // runner egg
  rEgg = new THREE.Group(); rEgg.add(outline(new THREE.Mesh(eggGeo, eggMat), 1.045)); rEgg.scale.setScalar(0.7); runScene.add(rEgg);
  rBlob = new THREE.Mesh(new THREE.CircleGeometry(0.75, 14), blob.material); rBlob.rotation.x = -Math.PI / 2; rBlob.position.y = 0.03; runScene.add(rBlob);
  for (var rp = 0; rp < 16; rp++) { var rpm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: rp % 2 ? 0x8a6a55 : 0x6f5444 })); rpm.visible = false; runScene.add(rpm); runParts.push({ m: rpm, v: new THREE.Vector3(), t: 0 }); }
}
export { runScene, runCam, rEgg, rBlob, runObs, runParts, mkTree, fmats };

// Mini game: rolling run (40%).
export function eggLow(th) {
  var sn = Math.sin(th), c = Math.cos(th), m = 1e9;
  for (var i = 0; i < PTS.length; i++) { var y = PTS[i].y - EHG / 2, a = PTS[i].x * sn; m = Math.min(m, a + y * c, -a + y * c); }
  return -m * 0.7;
}
// ---------- mini game: rolling run ----------
export var RN = { phase: 'off', x: 0, y: 1, vy: 0, vx: 0, rot: 0, t: 0, bonks: 0, splats: 0, L: 220, hold: 0, camX: 0, shake: 0, lives: 3, regen: 0, calm: 0, tries: 1, stun: 0, inv: 0 };
function runHud() { $('rdist').textContent = S.run.dist(Math.min(RN.L, Math.floor(RN.x)), RN.L); $('rbar').style.width = Math.min(100, RN.x / RN.L * 100) + '%'; $('rbar').style.backgroundColor = '#5f8f94'; }
function runLives() {
  var ls = $('rlives').children, p = Math.round(RN.regen * 100);
  for (var i = 0; i < 3; i++) {
    var el = ls[i]; el.classList.toggle('lost', i > RN.lives || (i === RN.lives && RN.regen <= 0));
    el.style.background = (i === RN.lives && RN.regen > 0) ? 'linear-gradient(to top, var(--butter) ' + p + '%, rgba(247, 239, 214, .25) ' + p + '%)' : '';
  }
}
function runRegen(dt) {
  RN.calm += dt;
  if (RN.lives >= 3 || RN.calm < 1.5) return;
  var before = Math.floor(RN.regen * 8);
  RN.regen += dt / 4;
  if (RN.regen >= 1) {
    RN.regen = 0; RN.lives++;
    var el = $('rlives').children[RN.lives - 1]; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    beep(659, 0.06, 'square', 0.03); beep(988, 0.08, 'square', 0.03, 0.06);
  } else if (Math.floor(RN.regen * 8) !== before) beep(440 + RN.regen * 440, 0.025, 'triangle', 0.015);
  runLives();
}
function runReset(again) {
  RN.x = 0; RN.rot = 0; RN.y = eggLow(0); RN.vy = 0; RN.vx = 0; RN.t = 0; RN.bonks = 0; RN.splats = 0; RN.hold = 0; RN.camX = 2.4; RN.shake = 0; RN.lives = 3; RN.regen = 0; RN.calm = 0; RN.stun = 0; RN.inv = 0;
  if (!again) RN.tries = 1;
  runObs.forEach(function (o) { o.passed = false; o.splat = false; o.wob = 0; o.g.visible = true; o.g.position.set(o.x0, 0, 0); o.g.rotation.set(0, 0, 0); });
  runHud(); runLives();
}
function runBonk(o) {
  RN.bonks++; RN.lives--; RN.regen = 0; RN.calm = 0; RN.inv = 0.5; RN.stun = 0.45; RN.vx = -7; RN.vy = 4; RN.shake = 0.35; o.wob = 1; runLives();
  runFloat(S.common.bonk, true); beep(120, 0.15, 'square', 0.05); beep(90, 0.15, 'square', 0.05, 0.08);
  if (RN.lives <= 0) {
    RN.phase = 'reset'; phone.dataset.sp = 'end'; hint(''); RN.tries++;
    talk(S.run.out, function () {
      wipeThen(function () { if (st.screen !== 'run') return; runReset(true); RN.phase = 'play'; phone.dataset.sp = 'play'; hint(S.run.hint); RN.vx = 4; });
    });
  }
}
export function startRun() {
  phone.dataset.sp = 'wait'; $('dtext').textContent = ''; RN.phase = 'wait'; st.wig = 1;
  [523, 659, 784].forEach(function (f, i) { beep(f, 0.08, 'square', 0.04, i * 0.08); });
  wipeThen(function () {
    if (st.screen !== 'run' || !ok) return;
    view.scene = runScene; view.cam = runCam; runReset(); RN.phase = 'intro'; phone.dataset.sp = 'intro';
    talk(S.run.intro, runPlay);
  });
}
function runPlay() { RN.phase = 'play'; phone.dataset.sp = 'play'; RN.vx = 4; hint(S.run.hint); var r = phone.getBoundingClientRect(); floatText(S.common.go, r.width / 2, r.height * 0.35); beep(784, 0.1); }
function runGrounded() { return RN.y <= eggLow(RN.rot) + 0.04; }
export function runJump() { if (RN.phase === 'play' && RN.stun <= 0 && runGrounded()) { RN.vy = 11; RN.vx = Math.max(RN.vx, 5.5); beep(392, 0.05, 'square', 0.035); beep(587, 0.06, 'square', 0.035, 0.05); } }
function runFloat(t, bad) {
  var v = rEgg.position.clone(); v.y += 1.6; v.project(runCam); var r = phone.getBoundingClientRect();
  floatText(t, (v.x + 1) / 2 * r.width, (1 - v.y) / 2 * r.height, bad);
}
function runBurst(n, x) {
  var k = 0; runParts.forEach(function (p) { if (k >= n || p.t > 0) return; k++; p.t = 0.6; p.m.visible = true; p.m.position.set(x + (Math.random() - 0.5), 0.2, (Math.random() - 0.5) * 1.2); p.v.set((Math.random() - 0.3) * 4, 3 + Math.random() * 3, (Math.random() - 0.5) * 2); });
}
export function runStep(dt) {
  if (RN.phase === 'off' || RN.phase === 'wait') return;
  var ground;
  if (RN.phase === 'play') {
    RN.t += dt; RN.inv -= dt;
    var target = 5 + 3.5 * RN.x / RN.L;
    runRegen(dt);
    if (RN.stun > 0) { RN.stun -= dt; RN.vx *= Math.pow(0.02, dt); }
    else RN.vx += (target - RN.vx) * Math.min(1, dt * (RN.vx < target * 0.7 ? 2.6 : 1.2));
    if (RN.x >= RN.L) { RN.phase = 'finish'; hint(''); runFloat(S.run.finish); [523, 659, 784, 1047].forEach(function (f, i) { beep(f, 0.12, 'square', 0.04, i * 0.09); }); }
  } else if (RN.phase === 'reset') {
    RN.vx *= Math.pow(0.02, dt);
  } else if (RN.phase === 'finish') {
    RN.vx = Math.max(0, Math.min(RN.vx, (RN.L + 6 - RN.x) * 2.2));
    if (RN.vx < 0.2) { RN.phase = 'home'; RN.hold = 0; }
  } else if (RN.phase === 'home') {
    RN.vx = 0; var up = Math.round(RN.rot / (Math.PI * 2)) * Math.PI * 2; RN.rot += (up - RN.rot) * Math.min(1, dt * 6); RN.hold += dt;
    if (RN.hold > 0.9) {
      RN.phase = 'done'; phone.dataset.sp = 'end';
      var last = S.run.last(RN.tries, RN.splats, RN.bonks);
      var nbr = recordBest('run', RN.t, false);
      talk(S.run.done(RN.t.toFixed(1), RN.bonks, nbr, last), function () {
        wipeThen(function () {
          if (st.screen !== 'run') return;
          if (st.arcade) { arcadeBack(); return; }
          st.done.run = true; save(true); setScreen('tap', false); say(S.run.after);
        });
      });
    }
  }
  RN.x += RN.vx * dt; RN.rot -= RN.vx * dt / 0.95;
  RN.vy -= 24 * dt; RN.y += RN.vy * dt;
  ground = eggLow(RN.rot); if (RN.y <= ground) { RN.y = ground; RN.vy = 0; }
  var bottom = RN.y - ground;
  if (RN.phase === 'play') runObs.forEach(function (o) {
    if (o.type === 'snail' && !o.passed && Math.abs(o.g.position.x - RN.x) < 12) o.g.position.x -= 0.7 * dt;
    var dx = Math.abs(o.g.position.x - RN.x);
    if (o.type === 'puddle') {
      if (!o.splat && dx < 1.0 && bottom < 0.05) { o.splat = true; RN.splats++; RN.vx *= 0.7; runBurst(8, o.g.position.x); runFloat(S.common.splat, true); beep(160, 0.12, 'triangle', 0.06); }
      return;
    }
    if (o.passed || RN.phase !== 'play') return;
    if (RN.x - 0.5 > o.g.position.x + o.w * 0.4) { o.passed = true; return; }
    if (RN.inv <= 0 && dx < 0.5 + o.w * 0.4 && bottom < o.h - 0.15) runBonk(o);
  });
  runObs.forEach(function (o) { if (o.wob > 0) { o.wob = Math.max(0, o.wob - dt * 2); o.g.rotation.z = Math.sin(o.wob * 30) * 0.25 * o.wob; } });
  runParts.forEach(function (p) { if (p.t <= 0) return; p.t -= dt; p.v.y -= 14 * dt; p.m.position.addScaledVector(p.v, dt); if (p.t <= 0 || p.m.position.y < 0) { p.t = 0; p.m.visible = false; } });
  rEgg.position.set(RN.x, RN.y, 0); rEgg.rotation.z = RN.rot;
  rBlob.position.x = RN.x; rBlob.scale.setScalar(Math.max(0.4, 1 - bottom * 0.25));
  var camAim = (RN.phase === 'play' || RN.phase === 'intro') ? RN.x + 2.4 : RN.x + 0.3;
  RN.camX += (camAim - RN.camX) * Math.min(1, dt * (RN.phase === 'play' ? 8 : 3));
  RN.shake *= Math.pow(0.002, dt);
  runCam.position.set(RN.camX + (Math.random() - 0.5) * RN.shake, 4.6 + (Math.random() - 0.5) * RN.shake, 27);
  runCam.lookAt(RN.camX, 3.0, 0);
  runHud();
}
