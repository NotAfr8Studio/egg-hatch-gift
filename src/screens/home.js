import { $, phone } from '../core/dom.js';
import { st, pendingEvent } from '../core/state.js';
import { save } from '../core/save.js';
import { say, choose, floatText } from '../ui/dialog.js';
import { GIFT } from '../config.js';
import { prettyDate } from '../gift/load.js';
import { siteOf } from '../gift/codec.js';
import { S } from '../strings.en.js';
import { setScreen } from '../core/nav.js';

// Home (after the hatch): gift card, mini game library, card view, start over.

// [key, name, how to describe the best score (null = no score)]
const GAMES = [
  ['snake', S.lib.names.snake, S.lib.bestSnake],
  ['run', S.lib.names.run, S.lib.bestTime],
  ['enc', S.lib.names.enc, null],
  ['clean', S.lib.names.clean, S.lib.bestTime],
  ['chase', S.lib.names.chase, S.lib.bestChase],
];

export function renderLib() {
  $('liblist').innerHTML = GAMES.map(function (g, i) {
    var b = st.best[g[0]], sub = g[2] ? (b == null ? S.lib.notPlayed : g[2](b)) : S.lib.justForFun;
    return '<span class="mi lrow' + (i === 0 ? ' sel' : '') + '" data-btn="lib" data-k="' + g[0] + '"><span class="ln">' + g[1] + '</span><span class="lb">' + sub + '</span></span>';
  }).join('') + '<span class="mi lrow back" data-btn="libback"><span class="ln">' + S.lib.back + '</span></span>';
}

// The gift card is drawn on a canvas so it can be saved as a photo.
var cardURL = null;
function drawCard() {
  var c = document.createElement('canvas'); c.width = 256; c.height = 160; var x = c.getContext('2d');
  x.fillStyle = '#2b2437'; x.fillRect(0, 0, 256, 160); x.fillStyle = '#f7efd6'; x.fillRect(4, 4, 248, 152);
  for (var yy = 4; yy < 44; yy++) for (var xx = 4; xx < 252; xx += 1) { x.fillStyle = ((xx + yy) >> 3) % 2 ? '#f3d98b' : '#e9a5a0'; x.fillRect(xx, yy, 1, 1); }
  x.fillStyle = '#2b2437'; x.fillRect(4, 44, 248, 4);
  x.textBaseline = 'alphabetic';
  var f = function (px) { return px + 'px "Press Start 2P", monospace'; };
  // text that comes from a gift link can be any length: shrink it until it fits the card
  var fit = function (t, px, y) { x.font = f(px); while (px > 5 && x.measureText(t).width > 200) { px--; x.font = f(px); } x.fillText(t, 16, y); };
  x.fillStyle = '#2b2437'; x.font = f(16); x.fillText(S.home.cardTitle, 16, 76);
  x.fillStyle = '#5f8f94'; fit(GIFT.demo ? S.home.demoKind : S.home.cardKind(GIFT.store), 8, 92);
  x.fillStyle = '#2b2437'; fit(GIFT.amount, 24, 120);
  if (GIFT.claimBy) { x.fillStyle = '#c9583f'; fit(S.home.claimBy(prettyDate(GIFT.claimBy) || GIFT.claimBy), 8, 136); }
  // a code goes on the card (so a saved photo keeps it); a claim link is only behind the button
  if (GIFT.kind === 'code') { x.fillStyle = '#2b2437'; fit(S.home.cardCodeLabel + ' ' + GIFT.code, 8, 150); }
  else { x.fillStyle = '#5f8f94'; x.font = f(8); x.fillText(GIFT.demo ? S.home.demoNote : S.home.cardNote, 16, 150); }
  x.save(); x.translate(226, 108); x.rotate(Math.PI / 4); x.fillStyle = '#2b2437'; x.fillRect(-9, -9, 18, 18); x.fillStyle = '#f3d98b'; x.fillRect(-7, -7, 14, 14); x.restore();
  return c.toDataURL('image/png');
}
// Link gift: big CLAIM ON <SHOP>. Code: COPY CODE (+ REDEEM ON <SHOP> when there is a page for it).
// Demo egg: MAKE AN EGG. Nothing at all: say so. Links were checked to be http(s) in gift/load.js.
function setCardButtons() {
  var mode = GIFT.demo ? 'demo' : GIFT.kind === 'link' && GIFT.url ? 'url' : GIFT.kind === 'code' && GIFT.code ? 'code' : 'none';
  $('claim').hidden = mode !== 'url'; $('claim').textContent = S.home.claim(GIFT.store);
  if (mode === 'url') $('claim').href = GIFT.url; else $('claim').removeAttribute('href');
  $('copybtn').hidden = mode !== 'code';
  $('redeem').hidden = mode !== 'code' || !GIFT.redeem; $('redeem').textContent = S.home.redeem(GIFT.store);
  if (GIFT.redeem) $('redeem').href = GIFT.redeem; else $('redeem').removeAttribute('href');
  $('makeown').hidden = mode !== 'demo';
  // the card says which site a button really opens: the shop name on the button is typed by whoever made the egg.
  // An invisible break point after each dot lets a long address wrap as "store." / "steampowered.com".
  var site = function (u) { return siteOf(u).replace(/\.(?!\.)/g, '.​'); };
  $('cvhint').textContent = mode === 'url' ? S.home.claimHint(site(GIFT.url))
    : mode === 'code' ? S.home.cardHint + (GIFT.redeem ? ' ' + S.home.redeemSite(site(GIFT.redeem)) : '')
    : mode === 'demo' ? S.home.demoHint : S.home.missing;
}
export function openCard() {
  var show = function () { setCardButtons(); cardURL = drawCard(); $('cardimg').src = cardURL; $('cardview').classList.add('show'); };
  // load the font with the € in the request, so the subset that has it is there before drawing
  if (document.fonts && document.fonts.load) document.fonts.load('24px "Press Start 2P"', (GIFT.amount || '') + S.home.cardTitle).then(show, show); else show();
}
export function closeCard() { $('cardview').classList.remove('show'); }

export function copyCode() {
  var pr = phone.getBoundingClientRect();
  try { navigator.clipboard.writeText(GIFT.code).then(function () { floatText(S.home.copied, pr.width / 2, pr.height * 0.2); }, function () { floatText(S.home.copyBlocked, pr.width / 2, pr.height * 0.2, true); }); }
  catch (err) { floatText(S.home.copyBlocked, pr.width / 2, pr.height * 0.2, true); }
}

// START OVER keeps the gift and the high scores. Mid-story it offers to continue instead.
export function startOver() {
  var mid = st.taps > 0 && st.taps < st.total;
  choose(mid ? S.startOver.midHead : S.startOver.head, mid ? [['cont', S.startOver.cont], ['yes', S.startOver.restartMid], ['no', S.startOver.no]] : [['yes', S.startOver.yes], ['no', S.startOver.noPlain]], function (c) {
    if (c === 'cont') { var pe = pendingEvent(); setScreen(pe || 'tap', false); if (!pe) say(S.welcomeBack(st.total - st.taps)); }
    if (c === 'yes') { st.taps = 0; st.done = {}; st.errorShown = false; save(true); setScreen('start', false); say(S.startOver.newEgg); }
  }, 1);
}
