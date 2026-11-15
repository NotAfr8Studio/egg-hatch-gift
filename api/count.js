// The egg counter, server side. A Vercel Function: Vercel runs this file on its own computers
// when a page calls /api/count. It keeps three numbers in the project's Redis store (Upstash,
// connected in the Vercel dashboard): how many eggs were made, opened, tapped (the friend started
// tapping) and hatched.
//
//   POST  the body is exactly one word: made | opened | tapped | hatched. Adds 1 to it for today
//         (UTC) and in total. Nothing else is read or stored: no address, no browser, no time
//         finer than the day. The gift never gets here: src/core/count.js is the only sender.
//   GET   the totals as JSON, {"made":12,"opened":9,"tapped":7,"hatched":4}. ?days=14 adds days.
//         Cached for 5 minutes, so a busy page can't use up the store's free monthly quota.
//
// Redis keys (hashes, one field per word): eggs:total, eggs:2026-11-15, ...
// Previews and branch deploys use test:eggs:... instead, so trying a change never touches the
// real numbers. Without the store (a copy of this repo on another host) it answers 503 and the
// game carries on: counting is never allowed to break an egg.

var WORDS = ['made', 'opened', 'tapped', 'hatched'];

function prefix() { return process.env.VERCEL_ENV === 'production' ? 'eggs:' : 'test:eggs:'; }
function day(back) { return new Date(Date.now() - back * 86400000).toISOString().slice(0, 10); }
function none(status, headers) { return new Response(null, { status: status, headers: headers }); }

// One round trip to Upstash's REST API, run as a transaction: [['HINCRBY', key, field, 1], ...]
async function store(commands) {
  var url = process.env.COUNTER_KV_REST_API_URL, token = process.env.COUNTER_KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('no store');
  var r = await fetch(url + '/multi-exec', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: JSON.stringify(commands) });
  if (!r.ok) throw new Error('store ' + r.status);
  return r.json();
}

// HGETALL answers with a flat list, ["made", "12", "opened", "9"]. Turn it into numbers.
function numbers(flat) {
  var out = { made: 0, opened: 0, tapped: 0, hatched: 0 };
  for (var i = 0; Array.isArray(flat) && i + 1 < flat.length; i += 2) {
    if (WORDS.indexOf(flat[i]) >= 0) out[flat[i]] = parseInt(flat[i + 1], 10) || 0;
  }
  return out;
}

async function add(request) {
  // Browsers say which site a request comes from: turn away other sites' pages. A script outside
  // a browser can still pretend, and that's fine for a fun number.
  var site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return none(403);
  if (+(request.headers.get('content-length') || 0) > 16) return none(413);
  var word = (await request.text()).trim();
  if (WORDS.indexOf(word) < 0) return none(400);
  var p = prefix();
  try { await store([['HINCRBY', p + 'total', word, 1], ['HINCRBY', p + day(0), word, 1]]); } catch (e) { return none(503); }
  return none(204);
}

async function read(request) {
  var n = Math.max(0, Math.min(31, parseInt(new URL(request.url).searchParams.get('days'), 10) || 0));
  var p = prefix(), commands = [['HGETALL', p + 'total']];
  for (var i = 0; i < n; i++) commands.push(['HGETALL', p + day(i)]);
  var res;
  try { res = await store(commands); } catch (e) { return none(503); }
  var body = numbers(res[0] && res[0].result);
  if (n) {
    body.days = {};
    for (var k = 0; k < n; k++) body.days[day(k)] = numbers(res[k + 1] && res[k + 1].result);
  }
  return Response.json(body, { headers: { 'Cache-Control': 'public, s-maxage=300' } });
}

export default {
  async fetch(request) {
    if (request.method === 'POST') return add(request);
    if (request.method === 'GET') return read(request);
    return none(405, { Allow: 'GET, POST' });
  },
};
