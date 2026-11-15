// The egg counter, browser side: the only code in this project that tells a server anything.
// It sends one word, made | opened | tapped | hatched, to api/count.js and nothing else. Never a
// name, face, gift, link or gift id; nothing about the person; no cookies. Why: project-history,
// 2026-11-15.
//
// Off in dev (it logs instead), in the /make preview, and in any browser that opened a page with
// ?nocount once (the owner's own testing). ?count turns it back on.
//
// "opened", "tapped" (the first tap on the egg) and "hatched" count once per gift per phone, and
// never for an egg made on this phone: makers try their own egg, and that shouldn't look like the
// friend opening it. Both lists live in this browser's localStorage and are never sent.

var WORDS = ['made', 'opened', 'tapped', 'hatched'];
var OFF = 'egg-nocount', MINE = 'egg-mine', DONE = 'egg-counted';
var seen = {}; // this page's answers, so every egg tap doesn't re-read localStorage

function get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function set(key, v) { try { if (v == null) localStorage.removeItem(key); else localStorage.setItem(key, v); } catch (e) {} }
function list(key) { try { var a = JSON.parse(get(key) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function remember(key, item, max) { var a = list(key); if (a.indexOf(item) < 0) { a.push(item); set(key, JSON.stringify(a.slice(-max))); } }

if (/[?&]nocount\b/.test(location.search)) set(OFF, '1');
else if (/[?&]count\b/.test(location.search)) set(OFF, null);

export function count(word) {
  if (WORDS.indexOf(word) < 0) return;
  if (/[?&]preview\b/.test(location.search) || get(OFF)) return;
  if (import.meta.env.DEV) { console.info('[count] would send:', word); return; }
  try { if (navigator.sendBeacon && navigator.sendBeacon('/api/count', word)) return; } catch (e) {}
  try { fetch('/api/count', { method: 'POST', body: word, keepalive: true }).catch(function () {}); } catch (e) {}
}

// The egg with this id (giftId of its link text) was made on this phone.
export function mine(id) { if (id) remember(MINE, id, 50); }

// Count a moment in a gift's life: once per phone, and never for this phone's own eggs.
export function countGift(word, id) {
  var key = word + ':' + id;
  if (seen[key]) return;
  seen[key] = true;
  if (!id || id === 'own' || id === 'preview' || list(MINE).indexOf(id) >= 0) return;
  if (list(DONE).indexOf(key) >= 0) return;
  remember(DONE, key, 200);
  count(word);
}
