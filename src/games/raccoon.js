import * as THREE from 'three';
import { $, phone } from '../core/dom.js';
import { COL, st, fx } from '../core/state.js';
import { beep } from '../core/audio.js';
import { save } from '../core/save.js';
import { ok, scene, camGo, toon, outline } from '../core/render.js';
import { say, talk, choose } from '../ui/dialog.js';
import { hud } from '../ui/hud.js';
import { blob, TOP, trees } from '../world/stage.js';
import { setScreen, arcadeBack } from '../core/nav.js';
import { S } from '../strings.en.js';

// The raccoon (egg thief), its platform, and the 60% encounter (a fake battle menu).
export var FOEX = 2.0, FOEZ = -9;
var raccoon, racPad, racParts = {};
if (ok) {
  // ---------- raccoon (egg thief) and its platform ----------
  racPad = new THREE.Group(); racPad.position.set(FOEX, 0, FOEZ); racPad.visible = false; scene.add(racPad);
  var ppb = outline(new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.8, 0.2, 22), toon(COL.sageD)), 1.03); ppb.position.y = 0.1; racPad.add(ppb);
  var ppt = outline(new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.65, 0.2, 22), toon(COL.sageL)), 1.03); ppt.position.y = 0.28; racPad.add(ppt);
  var ppbl = new THREE.Mesh(new THREE.CircleGeometry(0.95, 14), blob.material); ppbl.rotation.x = -Math.PI / 2; ppbl.position.y = TOP + 0.01; racPad.add(ppbl);
  raccoon = new THREE.Group(); raccoon.visible = false; raccoon.rotation.y = -2.3; raccoon.scale.setScalar(1.1); scene.add(raccoon);
  var rcG = toon(0x9d98ae), rcD = toon(0x4a4260), rcL = toon(0xeee6d6), inkM = new THREE.MeshBasicMaterial({ color: COL.ink }), whM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var rbody = outline(new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), rcG), 1.08); rbody.scale.set(1.35, 0.92, 0.9); rbody.position.y = 0.78; raccoon.add(rbody);
  var rhead = new THREE.Group(); rhead.position.set(0.8, 1.28, 0); raccoon.add(rhead); racParts.head = rhead;
  var rhd = outline(new THREE.Mesh(new THREE.SphereGeometry(0.46, 12, 10), rcG), 1.07); rhd.scale.set(1, 0.88, 1.05); rhead.add(rhd);
  var rmask = new THREE.Mesh(new THREE.SphereGeometry(0.47, 12, 8), rcD); rmask.scale.set(0.6, 0.34, 1.07); rmask.position.set(0.15, 0.07, 0); rhead.add(rmask);
  var rmuz = outline(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), rcL), 1.1); rmuz.scale.set(1.35, 0.75, 0.95); rmuz.position.set(0.38, -0.13, 0); rhead.add(rmuz);
  var rnose = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.1, 0.12), inkM); rnose.position.set(0.68, -0.07, 0); rhead.add(rnose);
  [-1, 1].forEach(function (sd) {
    var ew = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.13), whM); ew.position.set(0.41, 0.09, sd * 0.17); rhead.add(ew);
    var ep = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.07), inkM); ep.position.set(0.45, 0.08, sd * 0.17); rhead.add(ep);
    var ear = outline(new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.3, 5), rcG), 1.12); ear.position.set(-0.08, 0.42, sd * 0.25); rhead.add(ear);
    var paw = outline(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), rcD), 1.15); paw.position.set(0.78, 0.82, sd * 0.17); raccoon.add(paw); racParts[sd < 0 ? 'pawL' : 'pawR'] = paw;
  });
  var rtail = new THREE.Group(); rtail.position.set(-0.78, 0.9, 0); rtail.rotation.z = 0.55; raccoon.add(rtail); racParts.tail = rtail;
  for (var ti = 0; ti < 6; ti++) { var tr = outline(new THREE.Mesh(new THREE.SphereGeometry(0.25 - ti * 0.014, 10, 8), ti % 2 ? rcD : rcG), 1.07); tr.scale.set(0.95, 1, 1); tr.position.set(-ti * 0.25, 0, 0); rtail.add(tr); }
  racParts.legs = [];
  [[0.42, 0.27], [0.42, -0.27], [-0.42, 0.27], [-0.42, -0.27]].forEach(function (lp) { var lg = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.42, 6), rcD), 1.12); lg.position.set(lp[0], 0.21, lp[1]); raccoon.add(lg); racParts.legs.push(lg); });
  // (the loot sack on its back was removed 2026-11-12: a ball with a cone on top read as an onion or poop)
}
export { raccoon, racPad, racParts };

// ---------- mini game: raccoon encounter ----------
export var EN = { phase: 'off', t: 0 };
export function startEnc() {
  EN.phase = 'in'; EN.t = 0; phone.dataset.sp = 'wait'; $('dtext').textContent = ''; $('foebar').style.width = '100%';
  var w = $('wipe'); w.classList.remove('go'); void w.offsetWidth; w.classList.add('go');
  [392, 392, 466, 523, 587].forEach(function (f, i) { beep(f, 0.09, 'square', 0.04, i * 0.1); });
  if (ok) { setTimeout(function () { if (st.screen === 'enc') trees[1].visible = false; }, 450); racPad.visible = true; raccoon.visible = true; raccoon.position.set(FOEX + 6, TOP, FOEZ); raccoon.rotation.y = Math.PI; }
  camGo('enc', 1.0);
}
function encMenu() { EN.phase = 'menu'; choose(S.enc.menuHead, [['fight', S.enc.fight], ['tap', S.enc.tap], ['run', S.enc.run], ['snack', S.enc.snack]], encPick, 2); }
function encPick(k) {
  EN.phase = 'talk';
  if (k === 'run') { talk(S.enc.runLines, encMenu); return; }
  var lines = S.enc.lines[k];
  if (k === 'tap') { if (!st.arcade) { st.taps++; hud(); } st.wig = 1; st.squash = 1; beep(300, 0.06); }
  if (k === 'fight') { $('foebar').style.width = '82%'; st.wig = 1; fx.shake = 0.15; beep(150, 0.1, 'square', 0.05); }
  talk(lines, function () {
    EN.phase = 'leave'; EN.t = 0; beep(784, 0.06); beep(1047, 0.08, 'square', 0.04, 0.06);
    talk(S.enc.ranAway, function () { if (st.arcade) { arcadeBack(); return; } st.done.enc = true; save(true); setScreen('tap', false); say(S.enc.after); });
  });
}
export function encStep(dt) {
  if (!raccoon.visible) return;
  EN.t += dt; var walk = false;
  if (EN.phase === 'in') {
    var k = Math.min(1, EN.t / 1.5); walk = k < 1;
    raccoon.position.set(FOEX + 6 * (1 - k), TOP + (walk ? Math.abs(Math.sin(EN.t * 11)) * 0.18 : 0), FOEZ);
    raccoon.rotation.y = walk ? Math.PI : -2.3;
    if (EN.t > 1.6) { EN.phase = 'talk'; phone.dataset.sp = ''; beep(523, 0.08); talk(S.enc.appear, encMenu); }
  } else if (EN.phase === 'leave') {
    raccoon.rotation.y = 0; raccoon.position.x += 7 * dt; raccoon.position.y = TOP + Math.abs(Math.sin(EN.t * 14)) * 0.25; walk = true;
  } else {
    raccoon.position.set(FOEX, TOP + Math.abs(Math.sin(EN.t * 4)) * 0.03, FOEZ);
    racParts.head.rotation.z = Math.sin(EN.t * 2) * 0.08;
    var rub = Math.sin(EN.t * 14) * 0.07; racParts.pawL.position.x = 0.78 + rub; racParts.pawR.position.x = 0.78 - rub;
  }
  racParts.tail.rotation.y = Math.sin(EN.t * 3) * 0.45;
  var la = walk ? Math.sin(EN.t * 18) * 0.7 : 0;
  racParts.legs[0].rotation.z = la; racParts.legs[1].rotation.z = -la; racParts.legs[2].rotation.z = -la; racParts.legs[3].rotation.z = la;
}
