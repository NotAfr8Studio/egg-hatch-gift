// A gift lives entirely inside its link, in the part after the # (browsers never send that part to
// a server). This file packs a gift into that text and unpacks it again. It has no DOM or game
// dependencies, so the game and the /make page share it.
//
// Bytes, format 1:
//   [version 1][flags 1][body ...][check 2]        flags bit 0: body is deflate-raw compressed
//   body = taps u16 | kind u8 (0 none, 1 link, 2 code) | claimBy u16 (days since 2020-01-01, 0 = none)
//          | skin tone r g b | name | amount | store | gift | redeem       (text: u8 byte length + UTF-8)
//          | face: w u8, h u8 (0 = no face), n u8 colours, (n - 1) x rgb palette, then one index per
//            pixel, packed most significant bit first. Index 0 is "background": drawn in the skin tone.
//   check = low 16 bits of an FNV-1a hash over everything before it (catches a damaged link).
//
// Text: base 43, two bytes to three characters, using the QR code "alphanumeric" characters minus
// space and %. That set packs into a QR code ~25% tighter than ordinary text, which is what keeps
// a face small enough to scan. A trailing Z protects the last real character: chat apps sometimes
// leave a final "." or ":" out of a link.

export const VERSION = 1;
export const ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$*+-./:';
const END = 'Z';
export const KIND = { none: 0, link: 1, code: 2 };
const KIND_NAME = ['none', 'link', 'code'];

// Byte limits for each text (UTF-8 bytes, so an emoji counts as 4). The /make form uses these too.
export const LIMIT = { name: 12, amount: 8, store: 12, gift: 255, redeem: 255 };
export const TAPS = { min: 100, max: 50000 };

const DAY0 = Date.UTC(2020, 0, 1), DAY = 86400000;
export function dateToDays(iso) { if (!iso) return 0; var t = Date.parse(iso + 'T00:00:00Z'); return isNaN(t) ? 0 : Math.max(0, Math.min(65535, Math.round((t - DAY0) / DAY))); }
export function daysToDate(d) { if (!d) return ''; return new Date(DAY0 + d * DAY).toISOString().slice(0, 10); }

// ---------- base 43 ----------
export function toText(bytes) {
  var s = '';
  for (var i = 0; i + 1 < bytes.length; i += 2) {
    var v = bytes[i] * 256 + bytes[i + 1];
    s += ALPHA[v % 43] + ALPHA[Math.floor(v / 43) % 43] + ALPHA[Math.floor(v / 1849)];
  }
  if (bytes.length % 2) { var b = bytes[bytes.length - 1]; s += ALPHA[b % 43] + ALPHA[Math.floor(b / 43)]; }
  return s + END;
}
export function fromText(s) {
  s = String(s || '').trim().toUpperCase();
  if (s[s.length - 1] !== END) throw new Error('cut');
  s = s.slice(0, -1);
  if (s.length % 3 === 1) throw new Error('length');
  var out = new Uint8Array(Math.floor(s.length / 3) * 2 + (s.length % 3 ? 1 : 0)), o = 0;
  var val = function (c) { var k = ALPHA.indexOf(c); if (k < 0) throw new Error('char'); return k; };
  for (var i = 0; i < s.length; i += 3) {
    if (i + 2 < s.length) {
      var v = val(s[i]) + val(s[i + 1]) * 43 + val(s[i + 2]) * 1849;
      if (v > 65535) throw new Error('value');
      out[o++] = v >> 8; out[o++] = v & 255;
    } else {
      var w = val(s[i]) + val(s[i + 1]) * 43;
      if (w > 255) throw new Error('value');
      out[o++] = w;
    }
  }
  return out;
}

// ---------- small helpers ----------
export function fnv(bytes) {
  var h = 0x811c9dc5;
  for (var i = 0; i < bytes.length; i++) { h ^= bytes[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
// Short id for a gift link: keeps each gift's saved progress apart on one phone.
export function giftId(text) { var b = new TextEncoder().encode(text); return fnv(b).toString(36); }

function Writer() { this.a = []; }
Writer.prototype.u8 = function (v) { this.a.push(v & 255); };
Writer.prototype.u16 = function (v) { this.a.push((v >> 8) & 255, v & 255); };
Writer.prototype.str = function (s, max) {
  var b = clipBytes(s, max); this.u8(b.length); for (var i = 0; i < b.length; i++) this.a.push(b[i]);
};
Writer.prototype.bytes = function () { return Uint8Array.from(this.a); };

function Reader(b) { this.b = b; this.i = 0; }
Reader.prototype.u8 = function () { if (this.i >= this.b.length) throw new Error('short'); return this.b[this.i++]; };
Reader.prototype.u16 = function () { return this.u8() * 256 + this.u8(); };
Reader.prototype.str = function () {
  var n = this.u8(); if (this.i + n > this.b.length) throw new Error('short');
  var s = new TextDecoder().decode(this.b.subarray(this.i, this.i + n)); this.i += n; return s;
};

// Cut a text to at most `max` UTF-8 bytes without splitting a character.
export function clipBytes(s, max) {
  var enc = new TextEncoder(), out = '';
  for (var ch of String(s || '')) { if (enc.encode(out + ch).length > max) break; out += ch; }
  return enc.encode(out);
}
export function byteLength(s) { return new TextEncoder().encode(String(s || '')).length; }
// Strip control characters (line breaks included) from anything a link can carry, and the
// invisible direction marks that could flip a shop name or amount to read backwards.
export function clean(s) { return String(s || '').replace(/[\u0000-\u001f\u007f-\u009f؜‎‏‪-‮⁦-⁩]/g, '').trim(); }
// Only secure web links may become a button. Anything else (http:, javascript:, data:...) is dropped.
export function safeUrl(s) {
  s = clean(s); if (!s) return '';
  try { var u = new URL(s); return u.protocol === 'https:' ? u.href : ''; } catch (e) { return ''; }
}
// The site a link really opens, for the gift card ("Opens store.steampowered.com"). Whatever
// the shop field says, this is the truth: a fake claim page can't hide its own address. Look-alike
// letters come out as xn--..., the browser's own spelling. Very long names keep their end, which
// is the part that says whose site it is.
export function siteOf(url) {
  try { var h = new URL(url).hostname.replace(/^www\./, ''); return h.length > 40 ? '...' + h.slice(-40) : h; } catch (e) { return ''; }
}

// ---------- compression (built into browsers: Chrome 103+, Safari 16.4+, Firefox 113+) ----------
var canZip = typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
async function zip(bytes) {
  var s = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
async function unzip(bytes, cap) {
  var r = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(), parts = [], n = 0;
  for (;;) {
    var x = await r.read(); if (x.done) break;
    n += x.value.length; if (n > cap) { r.cancel(); throw new Error('too big'); }
    parts.push(x.value);
  }
  var out = new Uint8Array(n), o = 0; parts.forEach(function (p) { out.set(p, o); o += p.length; }); return out;
}

// ---------- the face ----------
// Median cut to at most `colours - 1` colours (index 0 stays free for the background), then a few
// rounds of nearest-colour refinement. Pixels with alpha under 128 become background.
export function quantize(rgba, w, h, colours) {
  var n = w * h, fg = [];
  for (var i = 0; i < n; i++) if (rgba[i * 4 + 3] >= 128) fg.push(i);
  var want = Math.max(1, colours - 1), boxes = fg.length ? [fg] : [];
  var range = function (box) {
    var lo = [255, 255, 255], hi = [0, 0, 0];
    box.forEach(function (p) { for (var c = 0; c < 3; c++) { var v = rgba[p * 4 + c]; if (v < lo[c]) lo[c] = v; if (v > hi[c]) hi[c] = v; } });
    var r = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]], ch = r[0] >= r[1] && r[0] >= r[2] ? 0 : r[1] >= r[2] ? 1 : 2;
    return { ch: ch, size: r[ch] };
  };
  while (boxes.length < want) {
    var best = -1, bestScore = 0, bestCh = 0;
    boxes.forEach(function (b, k) { if (b.length < 2) return; var r = range(b), sc = r.size * Math.sqrt(b.length); if (sc > bestScore) { bestScore = sc; best = k; bestCh = r.ch; } });
    if (best < 0) break;
    var box = boxes[best].slice().sort(function (p, q) { return rgba[p * 4 + bestCh] - rgba[q * 4 + bestCh]; }), mid = box.length >> 1;
    boxes.splice(best, 1, box.slice(0, mid), box.slice(mid));
  }
  var pal = boxes.map(function (b) { var s = [0, 0, 0]; b.forEach(function (p) { for (var c = 0; c < 3; c++) s[c] += rgba[p * 4 + c]; }); return s.map(function (v) { return Math.round(v / b.length); }); });
  var idx = new Uint8Array(n);
  for (var round = 0; round < 4; round++) {
    var sum = pal.map(function () { return [0, 0, 0, 0]; });
    fg.forEach(function (p) {
      var r = rgba[p * 4], g = rgba[p * 4 + 1], b = rgba[p * 4 + 2], bi = 0, bd = Infinity;
      for (var k = 0; k < pal.length; k++) { var dr = r - pal[k][0], dg = g - pal[k][1], db = b - pal[k][2], d = dr * dr * 2 + dg * dg * 4 + db * db * 3; if (d < bd) { bd = d; bi = k; } }
      idx[p] = bi + 1; var s = sum[bi]; s[0] += r; s[1] += g; s[2] += b; s[3]++;
    });
    if (round < 3) pal = pal.map(function (c, k) { var s = sum[k]; return s[3] ? [Math.round(s[0] / s[3]), Math.round(s[1] / s[3]), Math.round(s[2] / s[3])] : c; });
  }
  return { w: w, h: h, palette: pal, idx: idx };
}

// Face (from quantize or from a link) to RGBA pixels, background in the skin tone.
export function faceRGBA(face, tone) {
  var n = face.w * face.h, out = new Uint8ClampedArray(n * 4);
  for (var i = 0; i < n; i++) {
    var k = face.idx[i], c = k === 0 ? tone : face.palette[k - 1] || tone;
    out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = 255;
  }
  return out;
}

function bitsFor(colours) { var b = 1; while ((1 << b) < colours) b++; return b; }

// ---------- encode / decode ----------
// gift: { name, taps, kind: 'none'|'link'|'code', amount, store, gift, redeem, claimBy: 'YYYY-MM-DD', tone: [r,g,b], face }
export async function encodeGift(g, opts) {
  var w = new Writer();
  w.u16(Math.max(TAPS.min, Math.min(TAPS.max, Math.round(g.taps || 4000))));
  w.u8(KIND[g.kind] || 0);
  w.u16(dateToDays(g.claimBy));
  var tone = g.tone || [241, 201, 165]; w.u8(tone[0]); w.u8(tone[1]); w.u8(tone[2]);
  w.str(clean(g.name), LIMIT.name); w.str(clean(g.amount), LIMIT.amount); w.str(clean(g.store), LIMIT.store);
  w.str(clean(g.gift), LIMIT.gift); w.str(clean(g.redeem), LIMIT.redeem);
  var f = g.face;
  if (f && f.w && f.h) {
    var colours = f.palette.length + 1, bits = bitsFor(colours);
    w.u8(f.w); w.u8(f.h); w.u8(colours);
    f.palette.forEach(function (c) { w.u8(c[0]); w.u8(c[1]); w.u8(c[2]); });
    var acc = 0, nb = 0;
    for (var i = 0; i < f.w * f.h; i++) { acc = (acc << bits) | f.idx[i]; nb += bits; while (nb >= 8) { nb -= 8; w.u8(acc >> nb); acc &= (1 << nb) - 1; } }
    if (nb) w.u8(acc << (8 - nb));
  } else w.u8(0);
  var body = w.bytes(), flags = 0;
  if (canZip && !(opts && opts.noZip)) { var z = await zip(body); if (z.length < body.length) { body = z; flags |= 1; } }
  var all = new Uint8Array(body.length + 4);
  all[0] = VERSION; all[1] = flags; all.set(body, 2);
  var h = fnv(all.subarray(0, all.length - 2)); all[all.length - 2] = (h >> 8) & 255; all[all.length - 1] = h & 255;
  return toText(all);
}

// Returns the gift, or throws when the text is not a gift link or got damaged on the way.
export async function decodeGift(text) {
  var all = fromText(text);
  if (all.length < 6) throw new Error('short');
  var h = fnv(all.subarray(0, all.length - 2));
  if (all[all.length - 2] !== ((h >> 8) & 255) || all[all.length - 1] !== (h & 255)) throw new Error('check');
  if (all[0] !== VERSION) throw new Error('version');
  var body = all.subarray(2, all.length - 2);
  if (all[1] & 1) { if (!canZip) throw new Error('old browser'); body = await unzip(body, 65536); }
  var r = new Reader(body), g = {};
  g.taps = Math.max(TAPS.min, Math.min(TAPS.max, r.u16()));
  g.kind = KIND_NAME[r.u8()] || 'none';
  g.claimBy = daysToDate(r.u16());
  g.tone = [r.u8(), r.u8(), r.u8()];
  g.name = clean(r.str()); g.amount = clean(r.str()); g.store = clean(r.str()); g.gift = clean(r.str()); g.redeem = clean(r.str());
  var fw = r.u8();
  if (fw) {
    var fh = r.u8(), colours = r.u8(), pal = [];
    if (!fh || fw > 128 || fh > 128 || colours < 2) throw new Error('face');
    for (var k = 0; k < colours - 1; k++) pal.push([r.u8(), r.u8(), r.u8()]);
    var bits = bitsFor(colours), idx = new Uint8Array(fw * fh), acc = 0, nb = 0;
    for (var i = 0; i < idx.length; i++) {
      while (nb < bits) { acc = (acc << 8) | r.u8(); nb += 8; }
      nb -= bits; var v = (acc >> nb) & ((1 << bits) - 1); acc &= (1 << nb) - 1;
      idx[i] = v < colours ? v : 0;
    }
    g.face = { w: fw, h: fh, palette: pal, idx: idx };
  } else g.face = null;
  return g;
}
