import { $ } from '../core/dom.js';
import { st } from '../core/state.js';
import { ok } from '../core/render.js';
import { canSave } from '../core/save.js';
import { setFace, defaultFace } from '../world/stage.js';
import { setScreen } from '../core/nav.js';

// Dev tool: pick a photo, frame it, remove the background, and use it as the hatchling's face.
// The real faces come from gift links (the /make page) or public/face.png.
export const EDITOR_HTML = "<div class=\"editor\" id=\"editor\" hidden role=\"dialog\" aria-modal=\"true\" aria-label=\"Cut out a face\">\n  <div class=\"ed-card\">\n    <h2>Cut out the face</h2>\n    <div class=\"row\" id=\"edsteps\">\n      <button class=\"chip\" data-step=\"frame\" aria-pressed=\"true\">1 Frame</button>\n      <button class=\"chip\" data-step=\"cut\" aria-pressed=\"false\">2 Cut out</button>\n    </div>\n    <div class=\"ed-stage\"><canvas id=\"edc\" width=\"320\" height=\"320\"></canvas></div>\n    <div class=\"ed-ctl\" id=\"ctl-frame\">\n      <label>Zoom <input type=\"range\" id=\"zoom\" min=\"100\" max=\"400\" value=\"100\"></label>\n      <p>Drag the photo so the face is in the middle, then go to step 2.</p>\n    </div>\n    <div class=\"ed-ctl\" id=\"ctl-cut\" hidden>\n      <div class=\"row\" id=\"tools\">\n        <button class=\"chip\" data-tool=\"wand\" aria-pressed=\"true\">Remove background</button>\n        <button class=\"chip\" data-tool=\"erase\" aria-pressed=\"false\">Erase</button>\n        <button class=\"chip\" data-tool=\"restore\" aria-pressed=\"false\">Restore</button>\n      </div>\n      <label id=\"lab-tol\">Tolerance <input type=\"range\" id=\"tol\" min=\"8\" max=\"120\" value=\"40\"></label>\n      <label id=\"lab-brush\" hidden>Brush size <input type=\"range\" id=\"brush\" min=\"6\" max=\"60\" value=\"22\"></label>\n      <div class=\"row\"><button class=\"act quiet\" id=\"oval\">Trim to oval</button><button class=\"act quiet\" id=\"undo\">Undo</button></div>\n      <p>Tap the background to remove it. A higher tolerance removes more similar colours. Use Erase and Restore for the edges.</p>\n    </div>\n    <div class=\"ed-prev\"><canvas id=\"edp\" width=\"48\" height=\"48\"></canvas><span>Pixel preview, as it appears on the head</span></div>\n    <div class=\"row end\"><button class=\"act quiet\" id=\"edcancel\">Cancel</button><button class=\"act\" id=\"edok\">Use this face</button></div>\n  </div>\n</div>";

// Restore a face made earlier with the editor.
export function loadSavedFace() {
  if (!ok || !canSave) return; var d = null; try { d = localStorage.getItem('egg-dev-face'); } catch (e) {}
  if (!d) return; var img = new Image();
  img.onload = function () { var c = document.createElement('canvas'); c.width = c.height = 48; c.getContext('2d').drawImage(img, 0, 0); setFace(c); };
  img.src = d;
}

// Call once the editor markup and the "Try his face" buttons are in the page.
export function initFaceEditor() {
  var EDS = 320;
  var ed = { img: null, zoom: 1, ox: 0, oy: 0, step: 'frame', tool: 'wand', layer: document.createElement('canvas'), base: document.createElement('canvas'), hist: [], drag: null, last: null };
  ed.layer.width = ed.layer.height = ed.base.width = ed.base.height = EDS;
  var edc = $('edc'), edctx = edc.getContext('2d'), edp = $('edp'), edpctx = edp.getContext('2d');
  function frameDraw(ctx) {
    var img = ed.img, m = Math.min(img.width, img.height), sc = EDS / m * ed.zoom, dw = img.width * sc, dh = img.height * sc;
    var mx = Math.max(0, (dw - EDS) / 2), my = Math.max(0, (dh - EDS) / 2);
    ed.ox = Math.max(-mx, Math.min(mx, ed.ox)); ed.oy = Math.max(-my, Math.min(my, ed.oy));
    ctx.drawImage(img, (EDS - dw) / 2 + ed.ox, (EDS - dh) / 2 + ed.oy, dw, dh);
  }
  function edDraw() {
    edctx.clearRect(0, 0, EDS, EDS);
    if (ed.step === 'frame') {
      frameDraw(edctx);
      edctx.save(); edctx.strokeStyle = 'rgba(255,255,255,.85)'; edctx.lineWidth = 2; edctx.setLineDash([8, 6]);
      edctx.beginPath(); edctx.ellipse(EDS / 2, EDS / 2, EDS * 0.38, EDS * 0.48, 0, 0, Math.PI * 2); edctx.stroke(); edctx.restore();
    } else edctx.drawImage(ed.layer, 0, 0);
    edpctx.clearRect(0, 0, 48, 48); edpctx.imageSmoothingEnabled = true; edpctx.imageSmoothingQuality = 'high';
    if (ed.step === 'frame') { var t = document.createElement('canvas'); t.width = t.height = EDS; frameDraw(t.getContext('2d')); edpctx.drawImage(t, 0, 0, 48, 48); }
    else edpctx.drawImage(ed.layer, 0, 0, 48, 48);
  }
  function edStep(n) {
    if (n === 'cut' && ed.step !== 'cut') {
      var lc = ed.layer.getContext('2d'); lc.clearRect(0, 0, EDS, EDS); frameDraw(lc);
      var bc = ed.base.getContext('2d'); bc.clearRect(0, 0, EDS, EDS); bc.drawImage(ed.layer, 0, 0); ed.hist = [];
    }
    ed.step = n;
    document.querySelectorAll('#edsteps .chip').forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.step === n ? 'true' : 'false'); });
    $('ctl-frame').hidden = n !== 'frame'; $('ctl-cut').hidden = n !== 'cut';
    edc.classList.toggle('paint', n === 'cut' && ed.tool !== 'wand');
    edDraw();
  }
  function edTool(t) {
    ed.tool = t;
    document.querySelectorAll('#tools .chip').forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.tool === t ? 'true' : 'false'); });
    $('lab-tol').hidden = t !== 'wand'; $('lab-brush').hidden = t === 'wand';
    edc.classList.toggle('paint', t !== 'wand');
  }
  function pushHist() { ed.hist.push(ed.layer.getContext('2d').getImageData(0, 0, EDS, EDS)); if (ed.hist.length > 15) ed.hist.shift(); }
  function wand(x, y, tol) {
    var lc = ed.layer.getContext('2d'), id = lc.getImageData(0, 0, EDS, EDS), d = id.data, i0 = (y * EDS + x) * 4;
    if (d[i0 + 3] === 0) return;
    pushHist();
    var sr = d[i0], sg = d[i0 + 1], sb = d[i0 + 2], t2 = tol * tol, seen = new Uint8Array(EDS * EDS), stack = [y * EDS + x];
    while (stack.length) {
      var p = stack.pop(); if (seen[p]) continue; seen[p] = 1;
      var i = p * 4; if (d[i + 3] === 0) continue;
      var dr = d[i] - sr, dg = d[i + 1] - sg, db = d[i + 2] - sb;
      if (dr * dr + dg * dg + db * db > t2) continue;
      d[i + 3] = 0;
      var px = p % EDS, py = (p / EDS) | 0;
      if (px > 0) stack.push(p - 1); if (px < EDS - 1) stack.push(p + 1); if (py > 0) stack.push(p - EDS); if (py < EDS - 1) stack.push(p + EDS);
    }
    lc.putImageData(id, 0, 0);
  }
  function brushAt(x, y) {
    var lc = ed.layer.getContext('2d'), r = parseInt($('brush').value, 10) / 2;
    lc.save(); lc.beginPath(); lc.arc(x, y, r, 0, Math.PI * 2);
    if (ed.tool === 'erase') { lc.globalCompositeOperation = 'destination-out'; lc.fill(); }
    else { lc.clip(); lc.clearRect(0, 0, EDS, EDS); lc.drawImage(ed.base, 0, 0); }
    lc.restore();
  }
  function edPos(e) { var r = edc.getBoundingClientRect(); return { x: (e.clientX - r.left) * EDS / r.width, y: (e.clientY - r.top) * EDS / r.height }; }
  edc.addEventListener('pointerdown', function (e) {
    if (!ed.img) return; edc.setPointerCapture(e.pointerId); var p = edPos(e);
    if (ed.step === 'frame') { ed.drag = { x: p.x, y: p.y }; return; }
    if (ed.tool === 'wand') { wand(Math.max(0, Math.min(EDS - 1, Math.round(p.x))), Math.max(0, Math.min(EDS - 1, Math.round(p.y))), parseInt($('tol').value, 10)); edDraw(); return; }
    pushHist(); ed.drag = true; ed.last = p; brushAt(p.x, p.y); edDraw();
  });
  edc.addEventListener('pointermove', function (e) {
    if (!ed.drag) return; var p = edPos(e);
    if (ed.step === 'frame') { ed.ox += p.x - ed.drag.x; ed.oy += p.y - ed.drag.y; ed.drag = { x: p.x, y: p.y }; edDraw(); return; }
    var dx = p.x - ed.last.x, dy = p.y - ed.last.y, n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 3));
    for (var k = 1; k <= n; k++) brushAt(ed.last.x + dx * k / n, ed.last.y + dy * k / n);
    ed.last = p; edDraw();
  });
  ['pointerup', 'pointercancel'].forEach(function (ev) { edc.addEventListener(ev, function () { ed.drag = null; }); });
  $('zoom').addEventListener('input', function () { ed.zoom = parseInt(this.value, 10) / 100; edDraw(); });
  document.querySelectorAll('#edsteps .chip').forEach(function (b) { b.addEventListener('click', function () { if (ed.img) edStep(b.dataset.step); }); });
  document.querySelectorAll('#tools .chip').forEach(function (b) { b.addEventListener('click', function () { edTool(b.dataset.tool); }); });
  $('oval').addEventListener('click', function () {
    pushHist(); var lc = ed.layer.getContext('2d'); lc.save(); lc.globalCompositeOperation = 'destination-in'; lc.beginPath();
    lc.ellipse(EDS / 2, EDS / 2, EDS * 0.4, EDS * 0.49, 0, 0, Math.PI * 2); lc.fill(); lc.restore(); edDraw();
  });
  $('undo').addEventListener('click', function () { var h = ed.hist.pop(); if (h) { ed.layer.getContext('2d').putImageData(h, 0, 0); edDraw(); } });
  $('edcancel').addEventListener('click', function () { $('editor').hidden = true; });
  $('edok').addEventListener('click', function () {
    if (!ok || !ed.img) { $('editor').hidden = true; return; }
    var src = ed.layer;
    if (ed.step === 'frame') { src = document.createElement('canvas'); src.width = src.height = EDS; frameDraw(src.getContext('2d')); }
    var out = document.createElement('canvas'); out.width = out.height = 48; var o = out.getContext('2d');
    o.imageSmoothingEnabled = true; o.imageSmoothingQuality = 'high'; o.drawImage(src, 0, 0, 48, 48);
    setFace(out); $('editor').hidden = true;
    try { localStorage.setItem('egg-dev-face', out.toDataURL()); } catch (e) {}
    if (st.screen !== 'gift') setScreen('hatch', true);
  });
  $('file').addEventListener('change', function () {
    var f = this.files && this.files[0]; this.value = ''; if (!f || !ok) return;
    var rd = new FileReader();
    rd.onload = function () {
      var img = new Image();
      img.onload = function () { ed.img = img; ed.zoom = 1; ed.ox = 0; ed.oy = 0; $('zoom').value = 100; edTool('wand'); ed.step = 'x'; edStep('frame'); $('editor').hidden = false; };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  });
  $('resetface').addEventListener('click', function () { if (ok) setFace(defaultFace); try { localStorage.removeItem('egg-dev-face'); } catch (e) {} });
}
