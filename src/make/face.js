// The face editor on /make. Two steps, like cutting a face out of a photo by hand:
//   1 CUT    pick a shape and slide/zoom/turn the photo inside it
//   2 FIT    squash, stretch and move the cut-out on the face area of the head
// The face area on the character is 1.2 : 1 (wider than tall), so everything here works in a
// 240 x 200 "patch" that the game stretches over that area.
export const PW = 240, PH = 200;
export const SHAPES = ['square', 'rounded', 'oval', 'circle'];

export function createFaceEditor(canvas, onChange) {
  var view = canvas.getContext('2d');
  var ED = {
    img: null, shape: 'square', step: 'cut',
    zoom: 1, rot: 0, px: 0, py: 0,     // the photo inside the shape (offsets in patch pixels)
    sx: 1, sy: 1, fx: 0, fy: 0,        // the cut-out on the patch
    tone: [241, 201, 165],             // background behind the cut-out (set by the page)
  };
  var cutCv = mk(PW, PH), patchCv = mk(PW, PH), K = canvas.width / PW;

  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function shapePath(x, w, h) {
    x.beginPath();
    // a face-shaped oval: taller than wide (the patch itself is wide, so an oval filling it would
    // only lose its corners and look like ROUNDED)
    if (ED.shape === 'oval') x.ellipse(w / 2, h / 2, h * 0.37, h / 2, 0, 0, Math.PI * 2);
    else if (ED.shape === 'circle') x.arc(w / 2, h / 2, h / 2, 0, Math.PI * 2);
    else if (ED.shape === 'rounded') {
      var r = h * 0.24; x.moveTo(r, 0); x.arcTo(w, 0, w, h, r); x.arcTo(w, h, 0, h, r); x.arcTo(0, h, 0, 0, r); x.arcTo(0, 0, w, 0, r); x.closePath();
    } else x.rect(0, 0, w, h);
  }
  // the photo, framed: covers the patch at zoom 1, then zoomed, turned and moved
  function drawPhoto(x, scale) {
    var im = ED.img, cover = Math.max(PW / im.width, PH / im.height) * ED.zoom;
    x.save(); x.scale(scale, scale); x.translate(PW / 2 + ED.px, PH / 2 + ED.py); x.rotate(ED.rot * Math.PI / 180);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(im, -im.width * cover / 2, -im.height * cover / 2, im.width * cover, im.height * cover);
    x.restore();
  }
  function renderCut() {
    var x = cutCv.getContext('2d'); x.clearRect(0, 0, PW, PH);
    if (!ED.img) return;
    drawPhoto(x, 1);
    x.save(); x.globalCompositeOperation = 'destination-in'; shapePath(x, PW, PH); x.fillStyle = '#000'; x.fill(); x.restore();
  }
  function cutRect() { var w = PW * ED.sx, h = PH * ED.sy; return { x: (PW - w) / 2 + ED.fx, y: (PH - h) / 2 + ED.fy, w: w, h: h }; }
  function renderPatch() {
    var x = patchCv.getContext('2d'); x.clearRect(0, 0, PW, PH);
    if (!ED.img) return;
    var r = cutRect(); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(cutCv, r.x, r.y, r.w, r.h);
  }
  function toneCss() { return 'rgb(' + ED.tone.join(',') + ')'; }

  function draw() {
    var W = canvas.width, H = canvas.height; view.clearRect(0, 0, W, H);
    view.fillStyle = toneCss(); view.fillRect(0, 0, W, H);
    if (!ED.img) return;
    if (ED.step === 'cut') {
      // the whole photo faintly, the part inside the shape at full strength, the shape's edge dashed
      view.save(); view.globalAlpha = 0.35; drawPhoto(view, K); view.restore();
      view.drawImage(cutCv, 0, 0, W, H);
      view.save(); view.scale(K, K); shapePath(view, PW, PH); view.restore();
      view.save(); view.lineWidth = 2; view.setLineDash([8, 6]); view.strokeStyle = '#f7efd6'; view.stroke(); view.setLineDash([8, 6]); view.lineDashOffset = 7; view.strokeStyle = '#2b2437'; view.stroke(); view.restore();
    } else {
      view.drawImage(patchCv, 0, 0, W, H);
    }
  }
  function changed() { renderCut(); renderPatch(); draw(); if (onChange) onChange(); }

  // ---------- dragging, pinching, wheel, keys ----------
  var pts = new Map(), pinch = null;
  function pos(e) { var r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * PW, y: (e.clientY - r.top) / r.height * PH }; }
  canvas.addEventListener('pointerdown', function (e) {
    if (!ED.img) return; e.preventDefault();
    if (pickCb) { pickAt(pos(e)); return; }
    canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, pos(e)); pinch = null;
  });
  // PICK FROM PHOTO: average a small spot of what is on screen under the finger
  var pickCb = null;
  function pickAt(p) {
    var r = Math.round(3 * K), cx = Math.round(p.x * K), cy = Math.round(p.y * K);
    var x0 = Math.max(0, cx - r), y0 = Math.max(0, cy - r), w = Math.min(canvas.width, cx + r) - x0, h = Math.min(canvas.height, cy + r) - y0;
    if (w <= 0 || h <= 0) return;
    var d = view.getImageData(x0, y0, w, h).data, s = [0, 0, 0], n = 0;
    for (var i = 0; i < d.length; i += 4) { s[0] += d[i]; s[1] += d[i + 1]; s[2] += d[i + 2]; n++; }
    var cb = pickCb; pickCb = null; canvas.classList.remove('picking');
    cb([Math.round(s[0] / n), Math.round(s[1] / n), Math.round(s[2] / n)]);
  }
  canvas.addEventListener('pointermove', function (e) {
    if (!pts.has(e.pointerId)) return;
    var p = pos(e), old = pts.get(e.pointerId); pts.set(e.pointerId, p);
    if (pts.size === 1) {
      var dx = p.x - old.x, dy = p.y - old.y;
      if (ED.step === 'cut') { ED.px += dx; ED.py += dy; } else { ED.fx += dx; ED.fy += dy; }
    } else if (pts.size === 2) {
      var a = Array.from(pts.values()), d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      if (pinch) { var k = d / pinch; if (ED.step === 'cut') ED.zoom = clamp(ED.zoom * k, 0.5, 6); else { ED.sx = clamp(ED.sx * k, 0.3, 2); ED.sy = clamp(ED.sy * k, 0.3, 2); } }
      pinch = d;
    }
    clampAll(); changed(); syncInputs();
  });
  ['pointerup', 'pointercancel'].forEach(function (t) { canvas.addEventListener(t, function (e) { pts.delete(e.pointerId); pinch = null; }); });
  canvas.addEventListener('wheel', function (e) {
    if (!ED.img) return; e.preventDefault(); var k = Math.exp(-e.deltaY * 0.0015);
    if (ED.step === 'cut') ED.zoom = clamp(ED.zoom * k, 0.5, 6); else { ED.sx = clamp(ED.sx * k, 0.3, 2); ED.sy = clamp(ED.sy * k, 0.3, 2); }
    changed(); syncInputs();
  }, { passive: false });
  canvas.addEventListener('keydown', function (e) {
    if (!ED.img) return; var m = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[e.key]; if (!m) return;
    e.preventDefault(); if (ED.step === 'cut') { ED.px += m[0]; ED.py += m[1]; } else { ED.fx += m[0]; ED.fy += m[1]; }
    clampAll(); changed();
  });
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function clampAll() { ED.px = clamp(ED.px, -PW * 2, PW * 2); ED.py = clamp(ED.py, -PH * 2, PH * 2); ED.fx = clamp(ED.fx, -PW * 0.6, PW * 0.6); ED.fy = clamp(ED.fy, -PH * 0.6, PH * 0.6); }

  // the page's sliders, kept in step with pinches and the wheel
  var inputs = {};
  function syncInputs() {
    if (inputs.zoom) inputs.zoom.value = Math.round(ED.zoom * 100);
    if (inputs.sx) inputs.sx.value = Math.round(ED.sx * 100);
    if (inputs.sy) inputs.sy.value = Math.round(ED.sy * 100);
    if (inputs.rot) inputs.rot.value = Math.round(ED.rot);
    if (inputs.onSync) inputs.onSync();
  }

  // AUTO skin tone, from the cut-out (wherever the face was framed). The first version kept any
  // reddish pixel in a box, which let beige walls and background in. Now:
  //  1. only the middle of the face counts (an oval over cheeks and forehead, not the edges),
  //  2. a standard skin test in YCbCr colour space, which separates colour from brightness and so
  //     holds for light and dark skin (greys, blues, greens and whites drop out),
  //  3. of what's left, the darkest 55% (beard, eyebrows, shadow side) and the brightest 8% (shine)
  //     are dropped, and the median of the rest wins. Picking the most common colour instead was
  //     tried and landed on the shadow side of the face.
  function sampleTone() {
    if (!ED.img) return null;
    var d = patchCv.getContext('2d').getImageData(0, 0, PW, PH).data, px = [];
    for (var y = 0; y < PH; y += 2)
      for (var x = 0; x < PW; x += 2) {
        var i = (y * PW + x) * 4; if (d[i + 3] < 220) continue;
        var dx = (x / PW - 0.5) / 0.32, dy = (y / PH - 0.48) / 0.4; if (dx * dx + dy * dy > 1) continue;
        var r = d[i], g = d[i + 1], b = d[i + 2];
        var Y = 0.299 * r + 0.587 * g + 0.114 * b, cb = 128 - 0.1687 * r - 0.3313 * g + 0.5 * b, cr = 128 + 0.5 * r - 0.4187 * g - 0.0813 * b;
        if (Y < 35 || Y > 245 || cr < 133 || cr > 180 || cb < 77 || cb > 130) continue;
        px.push([r, g, b, Y]);
      }
    if (px.length < 12) return null;
    px.sort(function (a, b) { return a[3] - b[3]; });
    var lo = Math.floor(px.length * 0.55); px = px.slice(lo, Math.max(lo + 1, Math.floor(px.length * 0.92)));
    var med = function (k) { var a = px.map(function (p) { return p[k]; }).sort(function (p, q) { return p - q; }); return a[a.length >> 1]; };
    return [med(0), med(1), med(2)];
  }

  return {
    state: ED,
    bind: function (o) { inputs = o; syncInputs(); },
    setImage: function (img) {
      ED.img = img; ED.zoom = 1; ED.rot = 0; ED.px = 0; ED.py = 0; ED.sx = 1; ED.sy = 1; ED.fx = 0; ED.fy = 0; ED.step = 'cut';
      changed(); syncInputs();
    },
    clear: function () { ED.img = null; changed(); },
    set: function (k, v) { ED[k] = v; clampAll(); changed(); },
    resetFit: function () { ED.sx = 1; ED.sy = 1; ED.fx = 0; ED.fy = 0; changed(); syncInputs(); },
    setTone: function (t) { ED.tone = t; draw(); },
    // turn tap-to-pick on (with what to do with the colour) or off (null)
    picking: function (cb) { pickCb = cb || null; canvas.classList.toggle('picking', !!cb); },
    redraw: draw,
    patch: function () { return ED.img ? patchCv : null; },
    sampleTone: sampleTone,
  };
}

// Load a photo from the file picker into a canvas no bigger than 1200 px (keeps phones fast).
export function readPhoto(file) {
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var k = Math.min(1, 1200 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
      var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); resolve(c);
    };
    im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('unreadable')); };
    im.src = url;
  });
}
