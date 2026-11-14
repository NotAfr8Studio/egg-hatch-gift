import * as THREE from 'three';
import { $, phone } from '../core/dom.js';
import { COL, st, fx } from '../core/state.js';
import { beep } from '../core/audio.js';
import { save, recordBest } from '../core/save.js';
import { ok, scene, camera, camGo, toon, outline } from '../core/render.js';
import { say, talk, hint, floatText } from '../ui/dialog.js';
import { mud, egg, parts, composeEgg, TOP } from '../world/stage.js';
import { setScreen, arcadeBack } from '../core/nav.js';
import { S } from '../strings.en.js';

// Shower, soap bubbles and water drops for the 80% mud wash.
var showerG, bubbles = [], drops = [];
if (ok) {
  // ---------- shower, bubbles, drops (mud wash) ----------
  showerG = new THREE.Group(); showerG.visible = false; scene.add(showerG);
  var spipe = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 6), toon(0xa9a1bd)), 1.15); spipe.position.y = 6.1; showerG.add(spipe);
  var shead = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 0.32, 14), toon(COL.teal)), 1.06); shead.position.y = 4.6; showerG.add(shead);
  var bubMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }), bubGeo = new THREE.SphereGeometry(1, 8, 6);
  for (var bi = 0; bi < 40; bi++) { var bm = new THREE.Mesh(bubGeo, bubMat); bm.visible = false; scene.add(bm); bubbles.push({ m: bm, th: 0, vy: 0, fall: false }); }
  var dropMat = new THREE.MeshBasicMaterial({ color: 0x7fb6d6 }), dropGeo = new THREE.BoxGeometry(0.07, 0.24, 0.07);
  for (var di = 0; di < 36; di++) { var dm = new THREE.Mesh(dropGeo, dropMat); dm.visible = false; scene.add(dm); drops.push({ m: dm, vy: 0, stop: 0 }); }
}
export { showerG, bubbles, drops };

// Mini game: mud wash (80%). Scrub, rinse, dry.
export var CL = { phase: 'off', mud0: 1, rinse: 0, dry: 0, down: false, lx: 0, ly: 0, sq: 0, bi: 0 };
var ray = ok ? new THREE.Raycaster() : null, ndc = ok ? new THREE.Vector2() : null;
export function makeMud() {
  mud.x.clearRect(0, 0, 64, 64); var cols = ['#8a6a55', '#76594a', '#9c7a62'];
  for (var i = 0; i < 16; i++) {
    var u = (Math.random() - 0.5) * 0.22, v = 0.16 + Math.random() * 0.72, cx = Math.round(u * 64), cy = Math.round((1 - v) * 64), r = 2.5 + Math.random() * 3.5;
    for (var y = -7; y <= 7; y++) for (var x = -7; x <= 7; x++) {
      if (x * x + y * y > r * r + Math.random() * 5) continue;
      mud.x.fillStyle = cols[Math.abs(x * 3 + y * 7 + i) % 3];
      [-64, 0, 64].forEach(function (off) { mud.x.fillRect(cx + x + off, cy + y, 1, 1); });
    }
  }
  CL.mud0 = Math.max(1, mudCount());
}
function mudCount() { var d = mud.x.getImageData(0, 0, 64, 64).data, n = 0; for (var i = 3; i < d.length; i += 4) if (d[i] > 60) n++; return n; }
function cleanHud(label, p) { $('ctool').textContent = label; $('cpct').textContent = Math.round(p * 100) + '%'; var b = $('cbar'); b.style.width = (p * 100) + '%'; b.style.backgroundColor = '#5f8f94'; }
function eggHit(e) {
  var r = $('gl').getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera); var h = ray.intersectObject(egg, false); return h.length ? h[0] : null;
}
export function startClean() {
  CL.phase = 'intro'; phone.dataset.sp = 'intro'; CL.rinse = 0; CL.dry = 0; CL.t = 0; cleanHud(S.mud.scrub, 0);
  camGo('clean', 1.0); beep(220, 0.15, 'triangle', 0.06); beep(196, 0.25, 'triangle', 0.06, 0.15);
  talk(S.mud.intro, function () { CL.phase = 'scrub'; phone.dataset.sp = 'play'; $('tool').dataset.t = 'sponge'; hint(S.mud.hintScrub); });
}
function addBubble(p) {
  var b = bubbles[CL.bi++ % bubbles.length], n = new THREE.Vector3(p.x, 0, p.z).normalize();
  b.m.position.copy(p).addScaledVector(n, 0.06); b.m.scale.setScalar(0.08 + Math.random() * 0.12); b.m.visible = true; b.fall = false; b.vy = 0; b.th = Math.random() * 0.9;
}
function cleanNext(ph) {
  CL.phase = ph; var r = phone.getBoundingClientRect();
  if (ph === 'rinse') { mud.x.clearRect(0, 0, 64, 64); composeEgg(); showerG.visible = true; $('tool').dataset.t = 'none'; hint(S.mud.hintRinse); cleanHud(S.mud.rinse, 0); floatText(S.mud.nice, r.width / 2, r.height * 0.3); beep(659, 0.08); beep(880, 0.1, 'square', 0.04, 0.07); }
  if (ph === 'dry') { showerG.visible = false; $('tool').dataset.t = 'towel'; hint(S.mud.hintDry); cleanHud(S.mud.dry, 0); beep(659, 0.08); beep(880, 0.1, 'square', 0.04, 0.07); }
  if (ph === 'done') {
    mud.on = false; composeEgg(); $('tool').dataset.t = 'none'; hint(''); phone.dataset.sp = 'end'; st.squash = 1;
    floatText(S.mud.sparkle, r.width / 2, r.height * 0.3);
    parts.forEach(function (p, i) { if (i > 18) return; var a = Math.random() * Math.PI * 2; p.t = 0.9; p.m.visible = true; p.m.position.set(Math.cos(a) * 1.4, TOP + 0.5 + Math.random() * 3, Math.sin(a) * 1.4 + 0.5); p.v.set(Math.cos(a) * 1.5, 3 + Math.random() * 2, Math.sin(a) * 1.5); });
    [784, 988, 1175, 1568].forEach(function (f, i) { beep(f, 0.1, 'square', 0.035, i * 0.08); });
    var nbc = recordBest('clean', CL.t, false);
    talk(S.mud.done(CL.t.toFixed(1), nbc), function () { if (st.arcade) { arcadeBack(); return; } st.done.clean = true; save(true); setScreen('tap', false); say(S.mud.after); });
  }
}
export function cleanMove(e) {
  var r = phone.getBoundingClientRect(), tool = $('tool');
  tool.style.left = (e.clientX - r.left) + 'px'; tool.style.top = (e.clientY - r.top) + 'px';
  if (!CL.down) return;
  var d = Math.hypot(e.clientX - CL.lx, e.clientY - CL.ly); CL.lx = e.clientX; CL.ly = e.clientY;
  if (CL.phase === 'scrub') {
    var h = eggHit(e); if (!h || !h.uv) return;
    var x = h.uv.x * 64, y = (1 - h.uv.y) * 64;
    mud.x.save(); mud.x.globalCompositeOperation = 'destination-out';
    [-64, 0, 64].forEach(function (off) { mud.x.beginPath(); mud.x.arc(x + off, y, 5.5, 0, Math.PI * 2); mud.x.fill(); });
    mud.x.restore(); composeEgg();
    CL.sq += d; if (CL.sq > 18) { CL.sq = 0; addBubble(h.point); beep(700 + Math.random() * 500, 0.03, 'triangle', 0.02); }
    st.wig = Math.max(st.wig, 0.2);
    var p = 1 - mudCount() / CL.mud0; cleanHud(S.mud.scrub, Math.min(1, p / 0.85));
    if (p >= 0.85) cleanNext('rinse');
  } else if (CL.phase === 'dry') {
    if (!eggHit(e)) return;
    CL.dry += d / r.width / 8; st.wig = Math.max(st.wig, 0.25);
    if (Math.random() < 0.3) beep(300 + Math.random() * 200, 0.03, 'triangle', 0.015);
    cleanHud(S.mud.dry, Math.min(1, CL.dry));
    if (CL.dry >= 1) cleanNext('done');
  }
}
export function cleanStep(dt) {
  if (CL.phase === 'scrub' || CL.phase === 'rinse' || CL.phase === 'dry') CL.t += dt;
  if (CL.phase === 'rinse' && CL.down) {
    CL.rinse = Math.min(1, CL.rinse + dt / 2.2); cleanHud(S.mud.rinse, CL.rinse);
    for (var k = 0; k < 2; k++) { var dd = drops[Math.floor(Math.random() * drops.length)]; if (!dd.m.visible) { var a = Math.random() * Math.PI * 2, rr = Math.random() * 0.55; dd.m.position.set(Math.cos(a) * rr, 4.4, Math.sin(a) * rr + 0.2); dd.vy = -9; dd.stop = 3.3 + Math.random() * 0.4; dd.m.visible = true; } }
    if (Math.random() < 0.2) beep(1800 + Math.random() * 1500, 0.02, 'triangle', 0.01);
    if (CL.rinse >= 1) cleanNext('dry');
  }
  drops.forEach(function (d) { if (!d.m.visible) return; d.m.position.y += d.vy * dt; if (d.m.position.y < d.stop) d.m.visible = false; });
  bubbles.forEach(function (b) {
    if (!b.m.visible) return;
    if (CL.phase !== 'scrub' && !b.fall && (CL.rinse > b.th || CL.phase === 'dry' || CL.phase === 'done')) b.fall = true;
    if (b.fall) { b.vy -= 9 * dt; b.m.position.y += b.vy * dt; b.m.scale.multiplyScalar(Math.pow(0.3, dt)); if (b.m.position.y < 0.3) b.m.visible = false; }
    else b.m.scale.setScalar(b.m.scale.x * (1 + Math.sin(fx.clock * 9 + b.th * 20) * 0.004));
  });
}
