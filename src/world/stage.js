import * as THREE from 'three';
import { COL, st, fx, stageFor } from '../core/state.js';
import { ok, scene, camera, renderer, toon, outline } from '../core/render.js';
import { makeTuft, windTufts } from './grass.js';
import { HL, loadHatchling, play, setSkin, refreshTextures, setDanceSpeed, RAP_DANCE_SPEED } from './hatchling.js';
import { onMusic } from '../core/music.js';
import { faceRGBA } from '../gift/codec.js';

// dance in time with the birthday rap while it plays
onMusic(function (name) { setDanceSpeed(name === 'rap' ? RAP_DANCE_SPEED : 1); });

// The mud layer (mud wash) is painted on its own 64x64 canvas and composited over the egg texture.
export const mud = { c: document.createElement('canvas'), x: null, on: false };
mud.c.width = mud.c.height = 64; mud.x = mud.c.getContext('2d');

var egg, eggGroup, eggMat, hero, heroParts = {}, shards = [], parts = [], tufts = [], trees = [];
var ectx, etex, eggBaseX = null, composeEgg = function () {}, PTS = null, EHG = 3.4, faceMat, faceTex, faceCv;
var DEFAULT_SKIN = '#f1c9a5', skinHex = DEFAULT_SKIN;
// want = a screen asked for the hero; settled = the model loaded or failed; glb = the model is in use
var heroState = { want: false, settled: false, glb: false };

// Put a face on both hatchlings. `src` is any image or canvas; `tone` (hex) also recolours the skin.
// The pixel placeholder brings back the default tone.
export function setFace(src, tone) {
  if (!ok) return;
  if (src === fc) tone = DEFAULT_SKIN;
  if (tone) { skinHex = tone; heroParts.headMat.color.set(tone); setSkin(tone); }
  var c = faceCv.getContext('2d');
  c.imageSmoothingEnabled = src !== fc; // the pixel placeholder stays crisp, a photo is smoothed down
  c.fillStyle = skinHex; c.fillRect(0, 0, 128, 128);
  c.drawImage(src, 0, 0, 128, 128);
  faceTex.needsUpdate = true; refreshTextures();
}

// A face from a gift link: small palette pixels (gift/codec.js), background drawn in the skin tone.
export function setGiftFace(face, tone) {
  if (!ok || !face) return;
  var c = document.createElement('canvas'); c.width = face.w; c.height = face.h;
  c.getContext('2d').putImageData(new ImageData(faceRGBA(face, tone), face.w, face.h), 0, 0);
  setFace(c, '#' + new THREE.Color(tone[0] / 255, tone[1] / 255, tone[2] / 255).getHexString());
}

// Own copy without links: public/face.png, if there is one (384 x 320, see README).
export function loadFacePng() {
  if (!ok) return;
  var photo = new Image();
  photo.onload = function () {
    // dev only: a face made with the dev panel editor wins until "Use placeholder" clears it
    if (import.meta.env.DEV) { try { if (localStorage.getItem('egg-dev-face')) return; } catch (e) {} }
    setFace(photo, sampleTone(photo));
  };
  photo.src = import.meta.env.BASE_URL + 'face.png';
}

// Skin tone for face.png = median colour of two cheek patches (fractions of the crop). The spots fit a
// tight crop with the eyes about 45% down; a photo framed differently may need them moved.
function sampleTone(img) {
  var w = 96, h = 80, c = document.createElement('canvas'); c.width = w; c.height = h;
  var x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
  var d = x.getImageData(0, 0, w, h).data, r = [], g = [], b = [];
  [[0.22, 0.60], [0.78, 0.60]].forEach(function (p) {
    for (var yy = Math.round((p[1] - 0.04) * h); yy < Math.round((p[1] + 0.04) * h); yy++)
      for (var xx = Math.round((p[0] - 0.04) * w); xx < Math.round((p[0] + 0.04) * w); xx++) {
        var i = (yy * w + xx) * 4; if (d[i + 3] > 200) { r.push(d[i]); g.push(d[i + 1]); b.push(d[i + 2]); }
      }
  });
  if (!r.length) return null;
  var med = function (a) { a.sort(function (p, q) { return p - q; }); return a[a.length >> 1]; };
  return '#' + new THREE.Color(med(r) / 255, med(g) / 255, med(b) / 255).getHexString();
}

function useModel(glb) {
  heroState.glb = glb;
  heroParts.proc.visible = !glb;
  if (HL.root) HL.root.visible = glb;
  if (glb) { setSkin(skinHex); refreshTextures(); HL.cur = null; HL.mixer.stopAllAction(); play(heroState.clip || 'dance'); HL.mixer.update(0); try { var v = hero.visible; hero.visible = true; renderer.compile(scene, camera); hero.visible = v; } catch (e) {} }
  applyHero();
}
function applyHero() { if (hero) hero.visible = heroState.want && heroState.settled; }
export function heroUsesModel() { return heroState.glb; }

if (ok) {
  // ground
  var ground = new THREE.Mesh(new THREE.CircleGeometry(80, 24), toon(COL.sage));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  var fieldRing = new THREE.Mesh(new THREE.CircleGeometry(4.6, 28), toon(0xc7dca8));
  fieldRing.rotation.x = -Math.PI / 2; fieldRing.position.y = 0.01; scene.add(fieldRing);

  // platform circle
  var base = outline(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.65, 0.2, 26), toon(COL.sageD)), 1.03);
  base.position.y = 0.1; scene.add(base);
  var plat = outline(new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.45, 0.2, 26), toon(COL.sageL)), 1.03);
  plat.position.y = 0.28; scene.add(plat);
  var TOP = 0.38;
  var blob = new THREE.Mesh(new THREE.CircleGeometry(1.35, 18), new THREE.MeshBasicMaterial({ color: COL.ink, transparent: true, opacity: 0.22 }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = TOP + 0.01; scene.add(blob);

  for (var i = 0; i < 20; i++) {
    var g = makeTuft(4 + (i % 2), 0.6), ang = (i / 20) * Math.PI * 2 + (i % 2) * 0.12, rad = 1.75 + (i % 3) * 0.17;
    g.position.set(Math.cos(ang) * rad, TOP, Math.sin(ang) * rad);
    scene.add(g); tufts.push(g);
  }
  for (var i2 = 0; i2 < 16; i2++) {
    var g2 = makeTuft(4, 0.5 + Math.random() * 0.25), ang2 = Math.random() * Math.PI * 2, rad2 = 3.2 + Math.random() * 3.2;
    g2.position.set(Math.cos(ang2) * rad2, 0, Math.sin(ang2) * rad2 - 0.6); scene.add(g2);
  }

  // scenery: flowers and little trees
  var flowerMats = [toon(COL.rose), toon(COL.butter), toon(0xffffff), toon(COL.blue)];
  for (var f = 0; f < 22; f++) {
    var fa = Math.random() * Math.PI * 2, fr = 3.0 + Math.random() * 1.6;
    var fl = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), flowerMats[f % 4]);
    fl.position.set(Math.cos(fa) * fr, 0.1, Math.sin(fa) * fr * 0.9 - 0.4); fl.rotation.y = Math.random() * 3; scene.add(fl);
  }
  var treeSpots = [[-3.9, -11.6, 2.5], [4.4, -12.5, 2.9], [-6.5, -17, 3.2], [1.5, -21, 3.6], [6.8, -7.5, 2.2]];
  treeSpots.forEach(function (t) {
    var tg = new THREE.Group();
    var trunk = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 6), toon(0xb68b6a)), 1.1); trunk.position.y = 0.35; tg.add(trunk);
    for (var k = 0; k < 3; k++) {
      var cone = outline(new THREE.Mesh(new THREE.ConeGeometry(0.95 - k * 0.22, 0.95, 7), toon(k === 1 ? 0x9cc79a : 0xa9d3a0)), 1.06);
      cone.position.y = 1.0 + k * 0.62; tg.add(cone);
    }
    tg.position.set(t[0], 0, t[1]); tg.scale.setScalar(t[2]); scene.add(tg); trees.push(tg); tg.userData.box = new THREE.Box3().setFromObject(tg);
  });
  // ---------- egg ----------
  var EH = 3.4, ER = 1.3;
  var pts = [], N = 22;
  for (var j = 0; j <= N; j++) {
    var tt = j / N, x = (tt - 0.5) * 2;
    var rr = ER * Math.sqrt(Math.max(0, 1 - x * x)) * (1 - 0.16 * x);
    if (j === 0 || j === N) rr = 0.001;
    pts.push(new THREE.Vector2(rr, tt * EH));
  }
  var eggGeo = new THREE.LatheGeometry(pts, 20); eggGeo.translate(0, -EH / 2, 0);
  var ecv = document.createElement('canvas'); ecv.width = 64; ecv.height = 64; ectx = ecv.getContext('2d');
  etex = new THREE.CanvasTexture(ecv); etex.magFilter = etex.minFilter = THREE.NearestFilter; etex.generateMipmaps = false;
  eggMat = toon(0xffffff, etex);
  egg = outline(new THREE.Mesh(eggGeo, eggMat), 1.045);
  egg.position.y = EH / 2;
  eggGroup = new THREE.Group(); eggGroup.position.y = TOP; eggGroup.add(egg); scene.add(eggGroup);

  var spots = [[4, 30, 5, 0], [14, 22, 4, 1], [26, 40, 5, 0], [36, 28, 4, 1], [47, 44, 5, 0], [55, 20, 4, 1], [9, 48, 4, 1], [41, 12, 3, 0], [58, 54, 4, 1], [22, 54, 4, 0], [31, 8, 4, 1], [3, 12, 3, 0]];
  var CR = [
    [],
    [[[10, 7], [12, 12], [9, 16]]],
    [[[10, 7], [12, 12], [9, 16], [12, 22], [10, 27]], [[12, 12], [17, 14]]],
    [[[10, 7], [12, 12], [9, 16], [12, 22], [10, 27], [13, 32], [11, 38]], [[12, 12], [17, 14], [19, 19]], [[12, 22], [6, 24]]],
    [[[10, 7], [12, 12], [9, 16], [12, 22], [10, 27], [13, 32], [11, 38], [14, 44], [10, 50]], [[12, 12], [17, 14], [19, 19]], [[12, 22], [6, 24], [3, 28]], [[13, 32], [19, 34]]]
  ];
  var paintEgg = function (stage) {
    ectx.fillStyle = '#f7efd6'; ectx.fillRect(0, 0, 64, 64);
    spots.forEach(function (s) { ectx.fillStyle = s[3] ? '#e9a5a0' : '#9fc5d6'; ectx.fillRect(s[0], s[1], s[2], s[2]); });
    var px = function (x, y, c) { ectx.fillStyle = c; ectx.fillRect(x, y, 1, 1); };
    var line = function (a, b) {
      var x0 = a[0], y0 = a[1], x1 = b[0], y1 = b[1], dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy;
      for (;;) { px(x0 + 2, y0, '#f3d98b'); px(x0, y0, '#2b2437'); px(x0 + 1, y0, '#2b2437'); if (x0 === x1 && y0 === y1) break; var e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; } }
    };
    [0, 21, 42].forEach(function (off) {
      CR[stage].forEach(function (path) { for (var q = 0; q < path.length - 1; q++) line([path[q][0] + off, path[q][1]], [path[q + 1][0] + off, path[q + 1][1]]); });
    });
    eggBaseX.drawImage(ecv, 0, 0);
    if (mud.on) ectx.drawImage(mud.c, 0, 0);
    etex.needsUpdate = true;
  };
  var ebc = document.createElement('canvas'); ebc.width = ebc.height = 64; eggBaseX = ebc.getContext('2d');
  composeEgg = function () { ectx.drawImage(ebc, 0, 0); if (mud.on) ectx.drawImage(mud.c, 0, 0); etex.needsUpdate = true; };
  PTS = pts; EHG = EH;
  // ---------- hatchling ----------
  // `hero` is the container the hatch scales and the screens show. Inside it: the Blender model
  // (world/hatchling.js) or, if that fails to load, this procedural one (`proc`).
  hero = new THREE.Group(); hero.position.y = TOP; hero.visible = false; scene.add(hero);
  var proc = new THREE.Group(); hero.add(proc); heroParts.proc = proc;
  var body = outline(new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 10), toon(COL.rose)), 1.08);
  body.scale.set(1, 1.1, 0.9); body.position.y = 0.95; proc.add(body);
  var headMat = toon(COL.skin);
  var head = outline(new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 12), headMat), 1.06);
  head.position.y = 2.15; proc.add(head); heroParts.head = head; heroParts.headMat = headMat;
  // lit like the head (not unlit), so the skin-tone fill around the photo blends into the head
  faceMat = toon(0xffffff);
  var face = new THREE.Mesh(new THREE.SphereGeometry(0.93, 12, 10, Math.PI / 2 - 0.78, 1.56, Math.PI / 2 - 0.62, 1.24), faceMat);
  head.add(face);
  var hat = outline(new THREE.Mesh(new THREE.SphereGeometry(0.78, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon(COL.cream)), 1.06);
  hat.position.set(0, 0.62, -0.05); hat.rotation.x = -0.25; head.add(hat);
  [-1, 1].forEach(function (side) {
    var arm = new THREE.Group(); arm.position.set(side * 0.85, 1.35, 0);
    var am = outline(new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), toon(COL.rose)), 1.12); am.scale.y = 1.9; am.position.y = 0.3; arm.add(am);
    proc.add(arm); heroParts[side < 0 ? 'armL' : 'armR'] = arm;
    var leg = outline(new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), toon(COL.teal)), 1.12); leg.position.set(side * 0.38, 0.3, 0.05); leg.scale.y = 1.2;
    proc.add(leg); heroParts[side < 0 ? 'legL' : 'legR'] = leg;
  });
  var fc = document.createElement('canvas'); fc.width = 20; fc.height = 20;
  (function () {
    var c = fc.getContext('2d');
    c.fillStyle = '#f1c9a5'; c.fillRect(0, 0, 20, 20);
    c.fillStyle = '#e9a5a0'; c.fillRect(3, 11, 3, 2); c.fillRect(14, 11, 3, 2);
    c.fillStyle = '#2b2437'; c.fillRect(5, 6, 2, 3); c.fillRect(13, 6, 2, 3); c.fillRect(4, 4, 4, 1); c.fillRect(12, 4, 4, 1);
    c.fillRect(6, 14, 8, 1); c.fillRect(5, 13, 1, 1); c.fillRect(14, 13, 1, 1);
    c.fillStyle = '#fff'; c.fillRect(7, 15, 6, 1);
  })();
  // One 128 px face canvas feeds both hatchlings. It's filled with the skin tone first and the photo is
  // stretched over it, so transparent edges show skin instead of holes. public/face.png is cropped to the
  // shape of the model's Face area (1.2 : 1), which the UVs stretch over the whole texture.
  faceCv = document.createElement('canvas'); faceCv.width = faceCv.height = 128;
  faceTex = new THREE.CanvasTexture(faceCv); faceTex.magFilter = faceTex.minFilter = THREE.NearestFilter; faceTex.generateMipmaps = false;
  faceMat.map = faceTex; faceMat.needsUpdate = true;
  setFace(fc);
  // defaultFace = fc (exported below). The real face comes later: main.js calls setGiftFace() for a
  // gift link, or loadFacePng() for an own copy. Neither → this pixel face stays.

  // the Blender model; the hero stays hidden until it has loaded or failed (4 s at most)
  var settle = function (glb) { if (heroState.settled) { if (glb) useModel(true); return; } heroState.settled = true; useModel(glb); };
  loadHatchling(hero, faceCv, ecv, skinHex).then(settle);
  setTimeout(function () { settle(false); }, 4000);
  // shards and particles
  var shardGeo = new THREE.TetrahedronGeometry(0.34);
  for (var s = 0; s < 10; s++) {
    var sm = outline(new THREE.Mesh(shardGeo, toon(s % 3 === 0 ? COL.blue : COL.cream)), 1.12);
    sm.visible = false; scene.add(sm); shards.push({ m: sm, v: new THREE.Vector3(), r: new THREE.Vector3(), t: 0 });
  }
  var pGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  for (var p = 0; p < 26; p++) {
    var pm = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color: p % 2 ? COL.cream : COL.butter }));
    pm.visible = false; scene.add(pm); parts.push({ m: pm, v: new THREE.Vector3(), t: 0 });
  }
  paintEgg(0);
}

export function setStage() { var s = stageFor(st.taps); if (ok && (s !== st.stage || arguments[0])) { st.stage = s; paintEgg(s); } }
export function showEgg(on) { if (!ok) return; eggGroup.visible = on; }
// Show or hide the hatchling. `clip` is what the model plays: 'dance' by default, 'pose' for the hatch.
export function showHero(on, sc, clip) {
  if (!ok) return; var was = heroState.want; heroState.want = on; applyHero();
  if (!on) return;
  heroState.clip = clip || 'dance'; // remembered, so a model that arrives later starts on the right clip
  hero.scale.setScalar(sc == null ? 1 : sc); hero.position.y = TOP; hero.rotation.y = 0;
  // already dancing (hatch → gift): keep going instead of restarting the clip
  if (HL.ok && !(was && HL.cur === HL.act[clip || 'dance'])) { HL.cur = null; HL.mixer.stopAllAction(); play(clip || 'dance'); HL.mixer.update(0); }
  refreshTextures();
}

// Per-frame motion for the main scene: egg wiggle, hero dance, wind in the grass, shards, particles, fog.
export function stageStep(dt) {
  // egg motion
  st.wig *= Math.pow(0.0009, dt); st.squash *= Math.pow(0.0004, dt);
  var amp = 0.3 + (st.taps / st.total) * 0.15;
  eggGroup.rotation.z = Math.sin(fx.clock * 38) * amp * st.wig * (st.screen === 'hatch' ? 0.9 : 0.6);
  eggGroup.scale.set(1 + 0.06 * st.squash, 1 - 0.09 * st.squash + Math.sin(fx.clock * 2) * 0.008, 1 + 0.06 * st.squash);
  // hero dance
  if (hero.visible && heroState.glb) HL.mixer.update(dt);
  else if (hero.visible) {
    var d = fx.clock * 6.5;
    hero.position.y = TOP + Math.abs(Math.sin(d)) * 0.4;
    hero.rotation.y = Math.sin(d * 0.5) * 0.45;
    heroParts.head.rotation.z = Math.sin(d) * 0.14;
    heroParts.armL.rotation.z = -(1.9 + Math.sin(d * 2) * 0.55); heroParts.armR.rotation.z = (1.9 + Math.cos(d * 2) * 0.55);
    heroParts.legL.position.y = 0.3 + Math.max(0, Math.sin(d)) * 0.22; heroParts.legR.position.y = 0.3 + Math.max(0, -Math.sin(d)) * 0.22;
  }
  // tufts
  // wind: a wave rolls across the field, gusts come and go, each blade flutters a little
  var gust = 0.65 + 0.35 * Math.sin(fx.clock * 0.37) * Math.sin(fx.clock * 0.23 + 1);
  windTufts.forEach(function (g) {
    var u = g.userData, p = (u.pop *= Math.pow(0.02, dt)), b0 = u.base;
    g.scale.set(b0 * (1 + p * 0.3), b0 * (1 + p * 0.9), b0 * (1 + p * 0.3));
    var w = Math.sin(fx.clock * 1.8 - (g.position.x + g.position.z * 0.3) * 0.55 + u.ph * 0.3);
    g.rotation.z = -0.1 * w * gust;
    g.rotation.x = Math.sin(fx.clock * 1.1 + u.ph) * 0.035;
    for (var bi2 = 0; bi2 < u.blades.length; bi2++) { var bb = u.blades[bi2]; bb.rotation.z = bb.userData.rz + Math.sin(fx.clock * 5 + bb.userData.ph) * 0.06 * gust; }
  });
  // shards
  shards.forEach(function (s) {
    if (!s.m.visible) return; s.t += dt;
    s.v.y -= 16 * dt; s.m.position.addScaledVector(s.v, dt);
    if (s.m.position.y < 0.2) { s.m.position.y = 0.2; s.v.multiplyScalar(0.55); s.v.y = Math.abs(s.v.y) * 0.4; }
    s.m.rotation.x += s.r.x * dt; s.m.rotation.y += s.r.y * dt;
    if (s.t > 1.8) s.m.scale.setScalar(Math.max(0, 1 - (s.t - 1.8) * 2.2)); if (s.t > 2.6) s.m.visible = false;
  });
  parts.forEach(function (p) {
    if (p.t <= 0) return; p.t -= dt; p.v.y -= 9 * dt; p.m.position.addScaledVector(p.v, dt); p.m.scale.setScalar(Math.max(0.01, p.t * 2));
    if (p.t <= 0) p.m.visible = false;
  });
  if (scene.fog) { var fn = st.screen === 'snake' ? 60 : 24, ff = st.screen === 'snake' ? 110 : 52, fk = Math.min(1, dt * 2); scene.fog.near += (fn - scene.fog.near) * fk; scene.fog.far += (ff - scene.fog.far) * fk; }
}

export { egg, eggGroup, eggMat, eggGeo, hero, heroParts, shards, parts, tufts, trees, ectx, etex, composeEgg, PTS, EHG, TOP, blob, paintEgg };
export { fc as defaultFace };
