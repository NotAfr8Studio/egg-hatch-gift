import '../fonts/pixel.css';
import './make.css';
import { encodeGift, quantize, LIMIT, byteLength, clean, safeUrl, clipBytes, TAPS, giftId } from '../gift/codec.js';
import { count, mine } from '../core/count.js';
import { createFaceEditor, readPhoto } from './face.js';
import { makeQR, drawQR } from './qr.js';
import { STEAM_REDEEM_URL } from '../config.js';

// The /make page: a form, a face editor, a live preview of the character, and a QR code + link.
// Everything happens in this browser. The gift is packed into the link by gift/codec.js.

var $ = function (id) { return document.getElementById(id); };
var F = { kind: 'link', taps: 4000, toneAuto: true, tone: [241, 201, 165], view: 'face', made: false };
var GAME = new URL('../', location.href).href;   // the game itself: https://<site>/
var PREFIX = GAME + '#';

// Face detail, best first: [width, height, colours]. The first one whose QR code stays at
// version 20 or less (97 x 97 squares, scans fine off a phone screen) wins.
var LADDER = [[48, 40, 32], [48, 40, 16], [40, 33, 32], [40, 33, 16], [36, 30, 16], [32, 27, 16], [32, 27, 8], [28, 23, 8], [24, 20, 8]];
var MAX_VERSION = 20;

// ---------- the face editor ----------
var editor = createFaceEditor($('edc'), function () { if (F.toneAuto) autoTone(); schedule(); });
editor.bind({ zoom: $('zoom'), sx: $('sx'), sy: $('sy'), rot: $('rot') });
editor.setTone(F.tone);

$('pick').addEventListener('click', function () { $('file').click(); });
$('change').addEventListener('click', function () { $('file').click(); });
$('remove').addEventListener('click', function () { stopPicking(); editor.clear(); photoUI(false); schedule(); });
$('file').addEventListener('change', function () {
  var f = this.files && this.files[0]; this.value = ''; if (!f) return;
  $('file-err').hidden = true;
  readPhoto(f).then(function (c) { editor.setImage(c); setStep('cut'); photoUI(true); }, function () { $('file-err').hidden = false; });
});
// The skin colour only matters with a photo (without one the egg uses the pixel face and its own colour).
function photoUI(on) { document.querySelector('.ed').classList.toggle('has-photo', on); $('edempty').hidden = on; $('photo-actions').hidden = !on; $('tone-box').hidden = !on; if (!on) setTone([241, 201, 165]); }

function setStep(s) {
  editor.set('step', s);
  document.querySelectorAll('.tab').forEach(function (t) { t.setAttribute('aria-selected', t.dataset.step === s ? 'true' : 'false'); });
  $('ctl-cut').hidden = s !== 'cut'; $('ctl-fit').hidden = s !== 'fit';
}
document.querySelectorAll('.tab').forEach(function (t) { t.addEventListener('click', function () { setStep(t.dataset.step); }); });
radio('shapes', 'shape', function (v) { editor.set('shape', v); });
$('zoom').addEventListener('input', function () { editor.set('zoom', this.value / 100); });
$('rot').addEventListener('input', function () { editor.set('rot', +this.value); });
$('sx').addEventListener('input', function () { editor.set('sx', this.value / 100); });
$('sy').addEventListener('input', function () { editor.set('sy', this.value / 100); });
$('fitreset').addEventListener('click', function () { editor.resetFit(); });

// skin tone: AUTO samples the cheeks; picking a colour switches AUTO off
function hex(c) { return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }
function setTone(c) { F.tone = c; editor.setTone(c); $('tone').value = hex(c); }
function autoTone() { var t = editor.sampleTone(); if (t) setTone(t); }
function toneManual() { F.toneAuto = false; $('tone-auto').setAttribute('aria-pressed', 'false'); }
// the colour square is the colour picker itself: tapping it opens the phone's own picker
$('tone').addEventListener('input', function () {
  var v = this.value; toneManual();
  setTone([parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)]); schedule();
});
$('tone-auto').addEventListener('click', function () { F.toneAuto = true; this.setAttribute('aria-pressed', 'true'); stopPicking(); autoTone(); if (!editor.patch()) setTone([241, 201, 165]); schedule(); });
// PICK FROM PHOTO: the next tap on the photo takes the colour under the finger
function stopPicking() { editor.picking(null); $('tone-pick').setAttribute('aria-pressed', 'false'); $('picking').hidden = true; }
$('tone-pick').addEventListener('click', function () {
  if (this.getAttribute('aria-pressed') === 'true') { stopPicking(); return; }
  this.setAttribute('aria-pressed', 'true'); $('picking').hidden = false;
  editor.picking(function (c) { toneManual(); setTone(c); stopPicking(); schedule(); });
});
setTone(F.tone);

// ---------- the preview (the real game, in a frame) ----------
// Whichever side loads first, they find each other: the game says 'ready' when it starts, and
// answers 'hello' (sent when the frame finishes loading) with 'ready' too.
var pvReady = false, pvFace = null;
window.addEventListener('message', function (e) {
  if (e.origin !== location.origin || !e.data || e.data.type !== 'ready') return;
  pvReady = true; sendPreview(); sendView();
});
$('pv').addEventListener('load', function () { $('pv').contentWindow.postMessage({ type: 'hello' }, location.origin); });
function sendPreview() {
  if (!pvReady) return;
  var w = $('pv').contentWindow;
  if (pvFace) w.postMessage({ type: 'face', face: pvFace, tone: F.tone }, location.origin);
  else w.postMessage({ type: 'noface' }, location.origin); // no photo: the game's pixel face, as the friend would see it
}
function sendView() { if (pvReady) $('pv').contentWindow.postMessage({ type: 'view', view: F.view }, location.origin); }
radio(null, 'view', function (v) { F.view = v; sendView(); }, document.querySelector('.pv .chips'));

// ---------- the form ----------
function shout(s) { return new TextDecoder().decode(clipBytes(clean(s).toUpperCase(), LIMIT.name)); }
$('name').addEventListener('input', function () {
  $('name-say').querySelector('.say').textContent = 'HAPPY BIRTHDAY! ' + (shout(this.value) || 'FRIEND') + '!';
  if (byteLength(clean(this.value)) > LIMIT.name) showErr('name', 'A bit long. The egg cuts it to ' + shout(this.value) + '.'); else showErr('name', '');
  schedule();
});
radio('kinds', 'kind', function (v) {
  F.kind = v;
  $('giftfields').hidden = v === 'none'; $('nogift-help').hidden = v !== 'none';
  $('redeem-wrap').hidden = v !== 'code';
  $('gift-lab').textContent = v === 'code' ? 'Gift card code' : 'Gift card link';
  $('gift').type = v === 'code' ? 'text' : 'url'; $('gift').placeholder = v === 'code' ? 'XXXXX-XXXXX-XXXXX' : 'https://';
  $('gift-help').textContent = v === 'code'
    ? 'Type or paste the code. It shows up on the card with a COPY button. No code yet? Leave it empty.'
    : 'Any gift card works. No link yet? Leave it empty and the card tells them the present comes another way.';
  showErr('gift', ''); schedule();
});
['gift', 'store', 'amount', 'redeem', 'claimby'].forEach(function (id) { $(id).addEventListener('input', schedule); $(id).addEventListener('change', schedule); });
// the date field: hide the "Pick a date" hint once there is a date, and offer CLEAR (iPhone's
// date wheel has no way to empty it again)
function dateUI() { var has = !!$('claimby').value; $('claimby').parentNode.classList.toggle('has-value', has); $('claimby-clear').hidden = !has; }
['input', 'change'].forEach(function (t) { $('claimby').addEventListener(t, dateUI); });
$('claimby-clear').addEventListener('click', function () { $('claimby').value = ''; dateUI(); schedule(); });
dateUI();
$('store').addEventListener('input', function () { $('redeem').placeholder = isSteam() ? STEAM_REDEEM_URL : 'https://'; });
function isSteam() { return /^steam$/i.test(clean($('store').value)); }

radio('tapchips', 'taps', function (v) {
  $('custom-wrap').hidden = v !== 'custom';
  if (v !== 'custom') { F.taps = +v; $('taps').value = v; } else { F.taps = +$('taps').value || 4000; $('taps').focus(); }
  tapsHelp(); schedule();
});
$('taps').addEventListener('input', function () { F.taps = Math.max(TAPS.min, Math.min(TAPS.max, Math.round(+this.value || 0))); tapsHelp(); schedule(); });
function tapsHelp() {
  var t = F.taps, words = t <= 1000 ? 'A quick one. Just a few minutes of tapping.' : t <= 2000 ? 'About ten minutes of tapping.' : t <= 4000 ? '4,000 was perfect at a birthday party.' : t <= 10000 ? 'Now we\'re talking. Spread it over a day or two.' : 'Absolute marathon. Progress saves, so they can take days.';
  $('taps-help').textContent = words + ' Five mini games pop up along the way.';
}

// Generic radio-group helper for the chip rows: role="radio" buttons with data-<key>.
function radio(id, key, fn, el) {
  var group = el || $(id);
  group.querySelectorAll('[data-' + key + ']').forEach(function (b) {
    b.addEventListener('click', function () {
      group.querySelectorAll('[data-' + key + ']').forEach(function (c) { c.setAttribute('aria-checked', c === b ? 'true' : 'false'); });
      fn(b.dataset[key]);
    });
  });
}
function showErr(id, msg) { var e = $(id + '-err'), i = $(id); e.textContent = msg; e.hidden = !msg; if (i) i.setAttribute('aria-invalid', msg ? 'true' : 'false'); }

function fields() {
  var g = { name: clean($('name').value), taps: F.taps, kind: F.kind, store: clean($('store').value), amount: clean($('amount').value), claimBy: $('claimby').value || '', gift: '', redeem: '' };
  if (F.kind === 'link') g.gift = safeUrl($('gift').value);
  if (F.kind === 'code') { g.gift = clean($('gift').value); g.redeem = safeUrl($('redeem').value) || (isSteam() ? STEAM_REDEEM_URL : ''); }
  if (F.kind === 'none') { g.store = ''; g.amount = ''; g.claimBy = ''; }
  return g;
}
function validate() {
  var ok = true, g = fields();
  if (!g.name) { showErr('name', 'Who\'s it for? The egg needs a name.'); ok = false; }
  // The link or code is optional: some people hand over the present in person afterwards.
  // An empty field becomes "no gift card" in the egg; only a link that isn't a link is an error.
  if (F.kind === 'link') {
    var raw = clean($('gift').value);
    if (raw && !g.gift) { showErr('gift', 'That doesn\'t look like a link. It should start with https://'); ok = false; }
    else if (byteLength(g.gift) > LIMIT.gift) { showErr('gift', 'That link is too long to fit in a QR code.'); ok = false; }
    else showErr('gift', '');
  }
  if (F.kind === 'code') {
    if (byteLength(g.gift) > LIMIT.gift) { showErr('gift', 'That code is too long.'); ok = false; }
    else showErr('gift', '');
  }
  return ok;
}

// ---------- building the link ----------
var timer = null, buildN = 0, last = null;
function schedule() { clearTimeout(timer); timer = setTimeout(build, 140); }

function faceAt(patch, w, h, colours) {
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  var x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(patch, 0, 0, w, h);
  return quantize(x.getImageData(0, 0, w, h).data, w, h, colours);
}

async function build() {
  var my = ++buildN, base = fields(), patch = editor.patch(), pick = null;
  base.tone = F.tone.slice();
  if (!patch) {
    var t0 = await encodeGift(Object.assign({}, base, { face: null }));
    pick = { text: t0, face: null, step: null, qr: makeQR(PREFIX, t0) };
  } else {
    for (var i = 0; i < LADDER.length; i++) {
      var s = LADDER[i], face = faceAt(patch, s[0], s[1], s[2]);
      var text = await encodeGift(Object.assign({}, base, { face: face }));
      var qr = makeQR(PREFIX, text);
      pick = { text: text, face: face, step: s, qr: qr };
      if (qr && qr.version <= MAX_VERSION) break;
    }
  }
  if (my !== buildN) return; // something changed meanwhile; the newer build wins
  last = pick; pvFace = pick.face; sendPreview();
  if (F.made) showResult();
}

$('make').addEventListener('click', async function () {
  $('make-err').hidden = true;
  if (!validate()) { $('make-err').textContent = 'Almost there. Check the red bits above.'; $('make-err').hidden = false; var bad = document.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
  F.made = true; clearTimeout(timer); await build();
  // one word to the counter (core/count.js); pressing MAKE again on the same egg doesn't recount
  if (last && last.text !== counted) { counted = last.text; count('made'); }
  ours();
  $('result').hidden = false; $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
var counted = '';
// This phone made the egg in the result: opening or hatching it here is the maker testing, not
// the friend, so the counter skips it. Called again on every way out, since the link keeps
// updating as the form changes.
function ours() { if (last) mine(giftId(last.text)); }
$('open').addEventListener('click', ours);

function link() { return PREFIX + last.text; }
function showResult() {
  if (!last) return;
  if (!validate()) { $('result').classList.add('stale'); return; }
  $('result').classList.remove('stale');
  var qr = last.qr, cv = $('qr');
  if (!qr) { $('qrinfo').textContent = 'Whoa, too much for one QR code. Try a shorter gift link, or no photo.'; cv.width = cv.height = 0; return; }
  var cell = Math.max(2, Math.floor(400 / (qr.n + 8)));
  cv.width = cv.height = (qr.n + 8) * cell;
  drawQR(qr, cv.getContext('2d'), 0, 0, cell, '#2b2437', '#ffffff');
  var ease = qr.version <= 22 ? 'Scans fine from a screen or a print.' : 'This one is busy. Hold the phone close, or print it big.';
  var detail = last.step ? ' Their face made it in at ' + last.step[0] + ' x ' + last.step[1] + ' pixels.' : '';
  $('qrinfo').textContent = 'Your egg is ready! ' + ease + detail;
  $('open').href = link();
}

// ---------- sharing ----------
async function qrImage() {
  var qr = last.qr, name = shout($('name').value) || 'FRIEND';
  var W = 720, cell = Math.floor(560 / (qr.n + 8)), q = (qr.n + 8) * cell, H = q + 330;
  var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
  var font = function (px) { return px + 'px "Press Start 2P", monospace'; };
  try { await document.fonts.load(font(28), 'A BIRTHDAY EGG FOR ' + name + ' SCAN ME'); } catch (e) {}
  x.fillStyle = '#2b2437'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#f7efd6'; x.fillRect(12, 12, W - 24, H - 24);
  x.fillStyle = '#2b2437'; x.fillRect(22, 22, W - 44, H - 44);
  x.fillStyle = '#f7efd6'; x.fillRect(26, 26, W - 52, H - 52);
  x.textAlign = 'center'; x.fillStyle = '#2b2437';
  var tight = function (px) { if ('wordSpacing' in x) x.wordSpacing = Math.round(-px * 0.5) + 'px'; }; // same word spacing as the page
  tight(28);
  x.font = font(28); x.fillText('A BIRTHDAY EGG', W / 2, 100);
  var line = 'FOR ' + name, px = 28; x.font = font(px); while (px > 12 && x.measureText(line).width > W - 100) { px -= 2; x.font = font(px); }
  x.fillStyle = '#c9583f'; x.fillText(line, W / 2, 150);
  drawQR(qr, x, (W - q) / 2, 185, cell, '#2b2437', '#ffffff');
  x.fillStyle = '#5f8f94'; x.font = font(20); tight(20); x.fillText('SCAN ME, THEN TAP THE EGG', W / 2, 185 + q + 60);
  return new Promise(function (res) { c.toBlob(function (b) { res(b); }, 'image/png'); });
}
function fileName() { return 'egg-for-' + (clean($('name').value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'a-friend') + '.png'; }

$('save').addEventListener('click', async function () {
  if (!last || !last.qr) return;
  ours();
  var b = await qrImage(), a = document.createElement('a'), u = URL.createObjectURL(b);
  a.href = u; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
});
if (navigator.share) {
  $('share').hidden = false;
  $('share').addEventListener('click', async function () {
    if (!last || !last.qr) return;
    ours();
    try {
      var file = new File([await qrImage()], fileName(), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'A birthday egg' });
      else await navigator.share({ title: 'A birthday egg', url: link() });
    } catch (e) { /* cancelled */ }
  });
}
$('copy').addEventListener('click', function () {
  if (!last) return;
  ours();
  var done = function () { $('copied').hidden = false; setTimeout(function () { $('copied').hidden = true; }, 2500); };
  try { navigator.clipboard.writeText(link()).then(done, function () { prompt('Copy this link:', link()); }); } catch (e) { prompt('Copy this link:', link()); }
});

tapsHelp();
schedule();
