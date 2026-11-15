import { st, fx, EVENTS, evTap, stageFor } from '../core/state.js';
import { beep } from '../core/audio.js';
import { save } from '../core/save.js';
import { say } from '../ui/dialog.js';
import { hud } from '../ui/hud.js';
import { ok } from '../core/render.js';
import { parts, tufts, TOP, setStage } from '../world/stage.js';
import { runQuiz } from '../games/quiz.js';
import { setScreen } from '../core/nav.js';
import { S } from '../strings.en.js';
import { GIFT } from '../config.js';
import { countGift } from '../core/count.js';

// Milestone message for a tap count, or null.
export function msgAt(n) {
  var T = st.total;
  if (n === 1) return S.msg.first;
  if (n === 10) return S.msg.ten;
  if (n === 100 && T >= 1000) return S.msg.hundred(T - 100);
  if (n === Math.round(T * 0.25)) return S.msg.quarter(n);
  if (n === Math.round(T * 0.5)) return S.msg.half(n);
  if (n === Math.round(T * 0.75)) return S.msg.threeQuarter(n);
  if (n === Math.round(T * 0.9)) return S.msg.ninety(n);
  if (n > 0 && n % Math.round(T / 20) === 0) return S.msg.every(n, T - n);
  return null;
}
export function msgFor(n) { for (var k = n; k >= 1; k--) { var x = msgAt(k); if (x) return x; } return S.msg.first; }

function spawnPuff() {
  if (!ok) return; var n = 0;
  for (var i = 0; i < parts.length && n < 6; i++) {
    var p = parts[i]; if (p.t > 0) continue;
    p.t = 0.5; p.m.visible = true; var a = Math.random() * Math.PI * 2;
    p.m.position.set(Math.cos(a) * 1.0, TOP + 0.1, Math.sin(a) * 1.0 + 0.3);
    p.v.set(Math.cos(a) * 1.6, 2.4 + Math.random() * 1.2, Math.sin(a) * 1.6); n++;
  }
}
function popTufts() { if (!ok) return; for (var i = 0; i < 4; i++) tufts[Math.floor(Math.random() * tufts.length)].userData.pop = 1; }

export function tapEgg() {
  st.taps++; hud(); st.wig = 1; st.squash = 1; fx.shake = 0.03 + st.taps / st.total * 0.09;
  countGift('tapped', GIFT.id); // the friend started tapping: once per phone, see core/count.js
  beep(180 * Math.pow(2, st.taps / st.total * 1.6), 0.06, 'square', 0.035);
  spawnPuff(); popTufts();
  if (stageFor(st.taps) !== st.stage) { setStage(); beep(90, 0.18, 'triangle', 0.08); fx.shake = 0.2; }
  for (var ei = 0; ei < EVENTS.length; ei++) { var ek = EVENTS[ei][0]; if (st.taps >= evTap(ek) && !st.done[ek]) { setScreen(ek); return; } }
  if (st.taps >= Math.round(st.total * 0.3) && !st.done.quiz) { runQuiz(); return; }
  var mm = msgAt(st.taps); if (mm) say(mm);
  if (st.taps >= st.errorAt && !st.errorShown) { st.errorShown = true; save(true); setScreen('error'); return; }
  if (st.taps >= st.total) setScreen('hatch');
}
