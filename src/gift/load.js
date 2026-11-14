import { GIFT, OWN_GIFT } from '../config.js';
import { decodeGift, giftId, safeUrl, clean, LIMIT, clipBytes, TAPS } from './codec.js';

// Work out which egg this page is, before the game starts:
//   /?preview         the live preview inside the /make page (no saving, face arrives by message)
//   /#<gift>          a gift made on /make
//   /                 OWN_GIFT from config.js: a demo egg, or the one fixed gift of a self-hosted copy
// Resolves to 'preview', 'gift', 'own' or 'broken' (a gift link that got cut off or damaged).
export async function loadGift() {
  if (/[?&]preview\b/.test(location.search)) { GIFT.id = 'preview'; return 'preview'; }
  var text = (location.hash || '').replace(/^#/, '');
  if (!text) { useOwn(); return 'own'; }
  try {
    var g = await decodeGift(decodeURIComponent(text));
    Object.assign(GIFT, {
      id: giftId(text.toUpperCase()), demo: false,
      name: shout(g.name) || 'FRIEND', taps: g.taps, kind: g.kind,
      url: g.kind === 'link' ? safeUrl(g.gift) : '', code: g.kind === 'code' ? g.gift : '',
      store: shout(g.store), amount: g.amount, claimBy: g.claimBy, redeem: safeUrl(g.redeem),
      face: g.face, tone: g.tone,
    });
    // an empty (or unsafe) link or code means: no gift card in this egg, the present comes another way
    if ((GIFT.kind === 'link' && !GIFT.url) || (GIFT.kind === 'code' && !GIFT.code)) GIFT.kind = 'none';
    return 'gift';
  } catch (e) {
    console.warn('This gift link could not be read:', e && e.message);
    useOwn(); return 'broken';
  }
}

function useOwn() {
  var o = OWN_GIFT, url = safeUrl(o.link), code = clean(o.code);
  Object.assign(GIFT, {
    id: 'own', name: shout(o.name) || 'FRIEND', taps: Math.max(TAPS.min, Math.min(TAPS.max, Math.round(o.taps) || 4000)),
    kind: url ? 'link' : code ? 'code' : 'none', url: url, code: code, store: shout(o.store), amount: clean(o.amount),
    claimBy: clean(o.claimBy), redeem: safeUrl(o.redeem), face: null, tone: null,
  });
  GIFT.demo = GIFT.kind === 'none';
}

// The game writes names in capitals (EGG, RACCOON); the link keeps what was typed.
function shout(s) { return new TextDecoder().decode(clipBytes(clean(s).toUpperCase(), LIMIT.name)); }

// "2026-12-11" → "11 DEC 2026"
var MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function prettyDate(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return '';
  return parseInt(m[3], 10) + ' ' + MONTHS[parseInt(m[2], 10) - 1] + ' ' + m[1];
}
