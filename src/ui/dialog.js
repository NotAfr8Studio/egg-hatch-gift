import { $, phone } from '../core/dom.js';
import { st } from '../core/state.js';
import { beep } from '../core/audio.js';

// Dialog box (typewriter), choice menus, hints, floating text, flash and wipe effects.
var typeTimer = null, typing = false, fullText = '';
var dlgTimer = null;
function dlgAutoHide() {
  clearTimeout(dlgTimer);
  if (st.screen !== 'tap' || talkQ || choiceCb) return;
  dlgTimer = setTimeout(function () { if (st.screen === 'tap') phone.dataset.dlg = 'off'; }, 1400 + fullText.length * 35);
}
// Lines can carry a name from a gift link, so they are escaped before they go into the page.
function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
export function say(text) {
  clearTimeout(dlgTimer); phone.dataset.dlg = 'on';
  clearInterval(typeTimer); var i = 0, el = $('dtext'); typing = true; fullText = text;
  var draw = function () { el.innerHTML = '<span>' + esc(text.slice(0, i)) + '</span><span class="hid">' + esc(text.slice(i)) + '</span>'; };
  draw();
  typeTimer = setInterval(function () { i++; draw(); if (i >= text.length) { clearInterval(typeTimer); typing = false; dlgAutoHide(); } }, 26);
}
export function finishType() { clearInterval(typeTimer); typing = false; $('dtext').innerHTML = '<span>' + esc(fullText) + '</span>'; }
// Tap guard: right after a dialog line or menu appears, taps are ignored for a moment, so a fast tap
// (or the tap that was meant for the thing before) can't skip a line unread or pick a menu option by accident.
var lockUntil = 0;
export function locked() { return performance.now() < lockUntil; }
function lock(ms) { lockUntil = Math.max(lockUntil, performance.now() + ms); }

var talkQ = null;
export function talk(lines, done) { talkQ = { lines: lines, i: 0, done: done }; say(lines[0]); lock(400); }
export function advance() {
  if (!talkQ) return false;
  if (locked()) return true;
  lock(250);
  if (typing) { finishType(); return true; }
  talkQ.i++; beep(880, 0.03, 'square', 0.02);
  if (talkQ.i >= talkQ.lines.length) { var d = talkQ.done; talkQ = null; if (d) d(); }
  else say(talkQ.lines[talkQ.i]);
  return true;
}
var choiceCb = null;
export function choose(head, opts, cb, cols) {
  $('chead').textContent = head;
  var c = $('copts'); c.className = 'copts' + (cols === 1 ? ' one' : '');
  c.innerHTML = opts.map(function (o, i) { return '<span class="mi' + (i === 0 ? ' sel' : '') + '" data-btn="opt" data-k="' + o[0] + '">' + esc(o[1]) + '</span>'; }).join('');
  choiceCb = cb; $('choice').classList.add('show'); lock(350);
}
export function unchoose() { $('choice').classList.remove('show'); choiceCb = null; }
var hintTimer = null;
export function hint(t) { var h = $('hint'); clearTimeout(hintTimer); h.textContent = t || ''; h.classList.toggle('on', !!t); if (t) hintTimer = setTimeout(function () { h.classList.remove('on'); }, 2600); }
export function wipeThen(fn) { var w = $('wipe'); w.classList.remove('go'); void w.offsetWidth; w.classList.add('go'); setTimeout(fn, 450); }
export function floatText(t, x, y, bad) {
  var d = document.createElement('div'); d.className = 'float' + (bad ? ' bad' : ''); d.textContent = t;
  d.style.left = x + 'px'; d.style.top = y + 'px'; phone.appendChild(d);
  setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 750);
}
export function startFlash() { var f = $('flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }

// Forget any pending dialog or menu when the screen changes.
export function resetDialog() { clearTimeout(dlgTimer); phone.dataset.dlg = 'on'; talkQ = null; unchoose(); }

export { talkQ, choiceCb };
