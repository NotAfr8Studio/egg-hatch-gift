import * as THREE from 'three';
import { $ } from '../core/dom.js';
import { st, fx } from '../core/state.js';
import { beep } from '../core/audio.js';
import { save } from '../core/save.js';
import { CAM, camShot } from '../core/render.js';
import { say, startFlash } from '../ui/dialog.js';
import { eggGroup, hero, heroParts, shards, TOP, showHero, heroUsesModel } from '../world/stage.js';
import { play, jumpLength, facePos } from '../world/hatchling.js';
import { play as playMusic } from '../core/music.js';
import { GIFT } from '../config.js';
import { S } from '../strings.en.js';

function elastic(x) { if (x <= 0) return 0; if (x >= 1) return 1; return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1; }

// The hatch timeline:
//   0.75 s  flash and shards; he pops out in `pose`, camera cuts close on his face
//   2.1 s   "Happy Birthday! NAME!"
//   JUMP_AT `jump`, camera pulls back to the full body over the jump's real length
//   landing `dance` loops, "Egg came first. Then came NAME!"
//   +1.3 s  NEXT (tapping continues to the gift from here)
const POP = 0.75, BIRTHDAY = 2.1, JUMP_AT = 4.0, FACE_DIST = 7.0;
const tl = { land: 0 };
const fp = new THREE.Vector3(), fl = new THREE.Vector3();

// Close-up: work out where his face will be once he's full size, then put the camera in front of it.
function faceShot() {
  var sc = hero.scale.x; hero.scale.setScalar(1); hero.updateMatrixWorld(true);
  if (heroUsesModel()) facePos(fl); else heroParts.head.getWorldPosition(fl);
  hero.scale.setScalar(sc); hero.updateMatrixWorld(true);
  fp.set(fl.x, fl.y + 0.15, fl.z + FACE_DIST);
  camShot(fp, fl, 0);
}

export function hatchStep(dt) {
  if (st.screen === 'hatch' && st.hatchT >= 0) {
    st.hatchT += dt; var t = st.hatchT;
    if (t < POP) { st.wig = 1.4; fx.shake = 0.05 + t * 0.12; }
    if (t >= POP && st.step === 0) {
      st.step = 1; st.unlocked = true; save(true); startFlash(); eggGroup.visible = false;
      showHero(true, 0.01, 'pose'); fx.shake = 0.3; playMusic('rap');
      faceShot();
      shards.forEach(function (s, i) {
        var a = (i / shards.length) * Math.PI * 2 + Math.random() * 0.4;
        s.m.visible = true; s.t = 0; s.m.position.set(0, TOP + 1.4, 0); s.m.scale.setScalar(1);
        s.v.set(Math.cos(a) * (2.8 + Math.random() * 1.6), 4.5 + Math.random() * 3, Math.sin(a) * (2.8 + Math.random() * 1.6) + 1);
        s.r.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
      });
      [523, 659, 784, 1047].forEach(function (f, i) { beep(f, 0.14, 'square', 0.04, i * 0.09); });
      say(S.hatch.hatched);
    }
    if (t >= BIRTHDAY && st.step === 1) { st.step = 2; say(S.hatch.birthday(GIFT.name)); beep(784, 0.1, 'square', 0.04); beep(1047, 0.2, 'square', 0.04, 0.1); }
    if (t >= JUMP_AT && st.step === 2) {
      // the fallback hatchling has no jump; it just keeps dancing while the camera pulls back
      var len = heroUsesModel() ? jumpLength() : 1.6;
      st.step = 3; tl.land = JUMP_AT + len;
      if (heroUsesModel()) play('jump', 0.25);
      var g = CAM.gift; camShot(fp.set(g[0], g[1], g[2]), fl.set(g[3], g[4], g[5]), len * 0.9);
      beep(523, 0.06, 'square', 0.035); beep(784, 0.1, 'square', 0.035, 0.08);
    }
    if (st.step === 3 && t >= tl.land - 0.3) { st.step = 4; if (heroUsesModel()) play('dance', 0.4); say(S.hatch.cameFirst(GIFT.name)); beep(659, 0.08, 'square', 0.035); }
    if (st.step === 4 && t >= tl.land + 1.3) { st.step = 5; $('prompt').textContent = S.hatch.next; }
    if (t > POP) hero.scale.setScalar(Math.max(0.01, elastic(Math.min(1, (t - POP) / 0.9))));
  }
}

// Tapping on the hatch screen goes to the gift once NEXT shows.
export function hatchDone() { return st.step >= 5; }
