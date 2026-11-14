import { phone } from '../core/dom.js';
import { st } from '../core/state.js';
import { audio, beep, muted } from '../core/audio.js';
import { save, canSave } from '../core/save.js';
import { ok } from '../core/render.js';
import { say, advance, unchoose, talkQ, choiceCb, locked } from './dialog.js';
import { hud, setMuted } from './hud.js';
import { setScreen } from '../core/nav.js';
import { tapEgg } from '../screens/tap.js';
import { hatchDone } from '../screens/hatch.js';
import { openCard, closeCard, copyCode, startOver } from '../screens/home.js';
import { SN, snakeHit } from '../games/snakes.js';
import { RN, runJump } from '../games/runner.js';
import { CH, chaseInput } from '../games/chase.js';
import { CL, cleanMove } from '../games/mudwash.js';
import { S } from '../strings.en.js';

// All touch, mouse and keyboard input. One pointerdown handler routes by screen.
// A tap acts on touch (pointerdown); the browser then sends a "click" when the finger lifts. If the touch
// already moved a dialog on or changed the screen, that click would land on whatever just appeared under
// the finger (a menu option, VIEW CARD...), so it is swallowed.
var swallowClick = false;
export function initInput() {
  phone.addEventListener('pointerdown', function (e) {
    audio();
    swallowClick = false;
    var b = e.target.closest('[data-btn]');
    if (b) return;
    // returning visit: the first tap unlocks sound and continues where the game left off
    if (st.screen === 'cont') { var go = st.contNext; st.contNext = null; swallowClick = true; if (go) go(); return; }
    var before = st.screen, hadTalk = !!talkQ;
    if (st.screen === 'start') { setScreen('tap', false); st.taps = 0; hud(); say(S.msg.first); beep(523, 0.08, 'square', 0.04); beep(784, 0.12, 'square', 0.04, 0.08); }
    else if (st.screen === 'tap') { if (talkQ) advance(); else if (!choiceCb) tapEgg(); }
    else if (st.screen === 'hatch' && hatchDone()) setScreen('gift');
    else if (st.screen === 'snake') { if (SN.phase === 'play' && ok) snakeHit(e); else advance(); }
    else if (st.screen === 'enc') advance();
    else if (st.screen === 'chase') { if (CH.phase === 'play') CH.sw = { x: e.clientX, y: e.clientY, used: false }; else advance(); }
    else if (st.screen === 'run') { if (RN.phase === 'play') runJump(); else advance(); }
    else if (st.screen === 'clean') {
      if (CL.phase === 'scrub' || CL.phase === 'rinse' || CL.phase === 'dry') { CL.down = true; CL.lx = e.clientX; CL.ly = e.clientY; if (ok) cleanMove(e); }
      else advance();
    }
    if (hadTalk || st.screen !== before || choiceCb) swallowClick = true;
  });
  phone.addEventListener('pointermove', function (e) {
    if (st.screen === 'clean' && ok) cleanMove(e);
    if (st.screen === 'chase' && CH.sw && !CH.sw.used) {
      var dx = e.clientX - CH.sw.x, dy = e.clientY - CH.sw.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 22) { CH.sw.used = true; chaseInput(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy < 0 ? 'up' : 'down')); }
    }
  });
  window.addEventListener('pointerup', function () { if (st.screen === 'chase' && CH.sw) { if (!CH.sw.used) chaseInput('up'); CH.sw = null; } });
  window.addEventListener('keydown', function (e) {
    if (st.screen !== 'chase') return;
    var m = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' }[e.key];
    if (m) { e.preventDefault(); chaseInput(m); }
  });
  window.addEventListener('pointerup', function () { CL.down = false; });
  window.addEventListener('pointercancel', function () { CL.down = false; });

  // Buttons (anything with data-btn).
  phone.addEventListener('click', function (e) {
    if (swallowClick) { swallowClick = false; return; }
    var b = e.target.closest('[data-btn]'); if (!b) return; audio();
    var k = b.dataset.btn;
    if (k === 'snd') { setMuted(!muted); save(true); if (!muted) beep(660, 0.08); }
    if (k === 'refresh' && canSave) { st.afterError = true; save(true); location.reload(); return; }
    if (k === 'refresh') { setScreen('tap', false); hud(); say(S.error.kidding); beep(523, 0.08); beep(784, 0.1, 'square', 0.04, 0.08); }
    if (k === 'card' || k === 'viewcard') openCard();
    if (k === 'closecard') closeCard();
    if (k === 'copycode') copyCode();
    if (k === 'games') setScreen('lib');
    if (k === 'lib') { st.arcade = b.dataset.k; setScreen(b.dataset.k); }
    if (k === 'libback') setScreen('gift');
    if (k === 'replay') setScreen('hatch');
    if (k === 'again') startOver();
    if (k === 'opt' && choiceCb && !locked()) { var cb = choiceCb; unchoose(); beep(660, 0.05); cb(b.dataset.k); }
  });
}
