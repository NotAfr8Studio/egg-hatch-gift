import * as THREE from 'three';
import { $, phone } from '../core/dom.js';
import { COL, st, fx } from '../core/state.js';
import { beep } from '../core/audio.js';
import { recordBest } from '../core/save.js';
import { ok, scene, camera, view, camGo, toon, outline } from '../core/render.js';
import { talk, choose, hint, floatText, startFlash } from '../ui/dialog.js';
import { setScreen, arcadeBack } from '../core/nav.js';
import { S } from '../strings.en.js';

// Mini game: shoo the snakes (20%). Seen from above; tap the snakes before they reach the egg.
var snakes = [];
if (ok) {
  // ---------- snakes ----------
  var snA = toon(COL.teal), snB = toon(COL.butter), snH = toon(0x4f7f84);
  var eyeW = new THREE.MeshBasicMaterial({ color: 0xffffff }), eyeK = new THREE.MeshBasicMaterial({ color: COL.ink });
  for (var si = 0; si < 5; si++) {
    var sg = new THREE.Group(); sg.visible = false; scene.add(sg);
    var segs = [];
    for (var sk = 0; sk < 9; sk++) {
      var sr = sk === 0 ? 0.5 : 0.4 * (1 - sk / 9 * 0.5);
      var smesh = outline(new THREE.Mesh(new THREE.SphereGeometry(sr, 9, 7), sk === 0 ? snH : (sk % 2 ? snB : snA)), 1.12);
      smesh.scale.setScalar(1.5); smesh.userData.r = sr * 1.5; sg.add(smesh); segs.push(smesh);
    }
    [-1, 1].forEach(function (sd) {
      var ew = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.16), eyeW); ew.position.set(0.18, 0.38, sd * 0.2); segs[0].add(ew);
      var ek = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.09), eyeK); ek.position.set(0.23, 0.44, sd * 0.2); segs[0].add(ek);
    });
    var tongue = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.09), new THREE.MeshBasicMaterial({ color: 0xd9706c })); tongue.position.set(0.62, 0.05, 0); segs[0].add(tongue);
    snakes.push({ g: sg, segs: segs, tongue: tongue, state: 'off', a: 0, v: 0, t: 0, ph: 0, hold: 0 });
  }
}
export { snakes };

// ---------- mini game: shoo the snakes ----------
export var SN = { phase: 'off', shoo: 0, need: 20, lives: 1, maxLives: 1, fails: 0, spawnT: 0, hw: 4.6, hh: 9.2 };
export function snakeReset() { snakes.forEach(function (s) { s.state = 'off'; s.g.visible = false; }); SN.phase = 'off'; }
function snakeHud() { $('shoo').textContent = SN.need > 999 ? String(SN.shoo) : SN.shoo + '/' + SN.need; var ls = $('lives').children; for (var i = 0; i < ls.length; i++) ls[i].classList.toggle('lost', i >= SN.lives); }
export function startSnake() {
  SN.need = st.arcade ? 1e9 : 20; SN.fails = 0;
  SN.shoo = 0; SN.lives = SN.maxLives; snakeHud(); SN.phase = 'intro'; phone.dataset.sp = 'intro';
  camGo('top', 1.5); beep(330, 0.1, 'triangle', 0.06); beep(247, 0.2, 'triangle', 0.06, 0.12);
  talk(st.arcade ? S.snake.introArcade : S.snake.intro, snakePlay);
}
function snakePlay() { SN.phase = 'play'; phone.dataset.sp = 'play'; SN.spawnT = 0.3; hint(S.snake.hint); }
function spawnSnake() {
  var s = null; for (var i = 0; i < snakes.length; i++) if (snakes[i].state === 'off') { s = snakes[i]; break; } if (!s) return;
  var a = Math.random() * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
  var R = Math.min(SN.hw / Math.max(0.001, Math.abs(c)), SN.hh / Math.max(0.001, Math.abs(sn))) + 1.2;
  var travel = 2.5;
  s.v = (R - 2.1) / travel; s.a = a + Math.PI; s.ph = Math.random() * 6; s.t = 0; s.wt = 0; s.state = 'in'; s.g.visible = true;
  s.segs.forEach(function (m, k) { m.position.set(c * (R + k * 0.63), m.userData.r, sn * (R + k * 0.63)); });
}
function snakeGrab(s) {
  s.state = 'grab'; s.hold = 0.7; SN.lives--; snakeHud(); st.wig = 1.6; fx.shake = 0.35;
  var f = $('flash'); f.classList.add('red'); startFlash(); setTimeout(function () { f.classList.remove('red'); }, 700);
  beep(110, 0.3, 'sawtooth', 0.06);
  var r = phone.getBoundingClientRect(); floatText(S.snake.hey, r.width / 2, r.height * 0.42, true);
  if (SN.lives <= 0) snakeLose();
}
export function snakeHit(e) {
  var r = $('gl').getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, best = null, bd = r.width * 0.15, v = new THREE.Vector3();
  snakes.forEach(function (s) {
    if (s.state !== 'in' && s.state !== 'grab') return;
    [0, 2, 4].forEach(function (k) {
      v.copy(s.segs[k].position).project(camera);
      var d = Math.hypot((v.x + 1) / 2 * r.width - px, (1 - v.y) / 2 * r.height - py);
      if (d < bd) { bd = d; best = s; }
    });
  });
  if (!best) { floatText(S.snake.miss, px, py, true); beep(140, 0.05, 'square', 0.03); return; }
  best.state = 'shoo'; best.t = 0; SN.shoo++; snakeHud(); floatText(S.snake.shoo, px, py); fx.shake = 0.08;
  beep(660, 0.06); beep(990, 0.08, 'square', 0.04, 0.05);
  if (SN.shoo >= SN.need) snakeWin();
  else if (SN.shoo % 5 === 0) { var r2 = phone.getBoundingClientRect(); floatText(S.snake.faster, r2.width / 2, r2.height * 0.22, true); beep(880, 0.06, 'sawtooth', 0.03); beep(1175, 0.08, 'sawtooth', 0.03, 0.06); }
}
function snakesLeave() { snakes.forEach(function (s) { if (s.state === 'in' || s.state === 'grab') s.state = 'out'; }); }
function snakeWin() {
  SN.phase = 'end'; phone.dataset.sp = 'end'; snakesLeave();
  [523, 659, 784, 1047].forEach(function (f, i) { beep(f, 0.1, 'square', 0.04, 0.15 + i * 0.08); });
  recordBest('snake', SN.shoo, true);
  talk(S.snake.win, function () { finishSnake(S.snake.afterWin); });
}
function snakeLose() {
  SN.phase = 'end'; phone.dataset.sp = 'end'; SN.fails++; snakesLeave();
  var nb = recordBest('snake', SN.shoo, true);
  if (st.arcade) {
    talk(S.snake.arcadeLose(SN.shoo, nb, st.best.snake), function () {
      choose(S.common.again, [['retry', S.common.tryAgain], ['back', S.common.back]], function (k) { if (k === 'retry') { SN.shoo = 0; SN.lives = SN.maxLives; snakeHud(); snakePlay(); } else arcadeBack(); }, 1);
    });
    return;
  }
  talk(S.snake.lose, function () {
    var opts = [['retry', S.common.tryAgain]]; if (SN.fails >= 2) opts.push(['skip', S.common.skip]);
    choose(S.common.whatNow, opts, function (k) {
      if (k === 'retry') { SN.shoo = 0; SN.lives = SN.maxLives; snakeHud(); snakePlay(); }
      else finishSnake(S.snake.afterSkip);
    }, 1);
  });
}
function finishSnake(msg) { st.done.snake = true; setScreen('tap', false); say(msg); }
export function snakeStep(dt) {
  if (SN.phase === 'play') {
    SN.spawnT -= dt;
    var active = snakes.filter(function (s) { return s.state === 'in'; }).length, maxA = SN.shoo < 4 ? 1 : SN.shoo < 11 ? 2 : 3;
    if (SN.spawnT <= 0 && active < maxA) { spawnSnake(); SN.spawnT = Math.max(0.45, 1.4 - SN.shoo * 0.05); }
  }
  snakes.forEach(function (s) {
    if (s.state === 'off') return;
    s.t += dt; var h = s.segs[0].position, dist = Math.hypot(h.x, h.z);
    if (s.state === 'in') {
      var mul = 1 + SN.shoo * 0.06; s.wt += dt * mul;
      s.a = Math.atan2(-h.z, -h.x) + Math.sin(s.wt * 7 + s.ph) * 0.55;
      h.x += Math.cos(s.a) * s.v * mul * dt; h.z += Math.sin(s.a) * s.v * mul * dt;
      if (dist < 2.1 && SN.phase === 'play') snakeGrab(s);
    } else if (s.state === 'grab') {
      s.hold -= dt; s.a = Math.atan2(-h.z, -h.x) + Math.sin(s.t * 20) * 0.3;
      if (s.hold <= 0) s.state = 'out';
    } else {
      s.a = Math.atan2(h.z, h.x) + Math.sin(s.t * 12 + s.ph) * 0.5;
      var sp = s.state === 'shoo' ? 10 : 6;
      h.x += Math.cos(s.a) * sp * dt; h.z += Math.sin(s.a) * sp * dt;
      if (dist > Math.max(SN.hw, SN.hh) + 5) { s.state = 'off'; s.g.visible = false; return; }
    }
    for (var k = 1; k < s.segs.length; k++) {
      var p = s.segs[k].position, q = s.segs[k - 1].position, dx = q.x - p.x, dz = q.z - p.z, L = Math.hypot(dx, dz);
      if (L > 0.63) { p.x = q.x - dx / L * 0.63; p.z = q.z - dz / L * 0.63; }
    }
    s.segs.forEach(function (m, k) {
      var d2 = Math.hypot(m.position.x, m.position.z), lift = 0.38 * Math.max(0, Math.min(1, (2.9 - d2) / 0.4));
      m.position.y = m.userData.r + lift + (k === 0 && s.state === 'shoo' ? Math.abs(Math.sin(s.t * 14)) * 0.6 : 0);
    });
    s.segs[0].rotation.y = -s.a;
    s.tongue.visible = Math.sin(s.t * 9 + s.ph) > 0.3;
  });
}

// During this game a tree is removed only once the camera can no longer see it (no popping).
var projM = ok ? new THREE.Matrix4() : null, frus = ok ? new THREE.Frustum() : null;
export function cullTrees(trees) {
  if (st.screen === 'snake' && view.scene === scene) {
    projM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frus.setFromProjectionMatrix(projM);
    trees.forEach(function (t) { if (t.visible && !frus.intersectsBox(t.userData.box)) t.visible = false; });
  }
}
