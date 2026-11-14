import { qrcode } from 'qrcode-generator';

// QR code for a gift link. The start of the link (https://site/#) goes in as ordinary bytes; the gift
// itself only uses QR "alphanumeric" characters (see gift/codec.js), which pack about 25% tighter.
// Error correction L: the code is meant for screens and prints, not for scratched stickers.
export function makeQR(prefix, payload) {
  try {
    var q = qrcode(0, 'L'); q.addData(prefix, 'Byte'); q.addData(payload, 'Alphanumeric'); q.make();
    return { q: q, n: q.getModuleCount(), version: (q.getModuleCount() - 17) / 4 };
  } catch (e) { return null; } // longer than the biggest QR code (version 40)
}

// Draw it with a 4-module quiet zone, which scanners need around the code.
export function drawQR(qr, ctx, x0, y0, cell, ink, paper) {
  var n = qr.n, q = qr.q, m = 4;
  ctx.fillStyle = paper; ctx.fillRect(x0, y0, (n + m * 2) * cell, (n + m * 2) * cell);
  ctx.fillStyle = ink;
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(x0 + (c + m) * cell, y0 + (r + m) * cell, cell, cell);
  return (n + m * 2) * cell;
}
