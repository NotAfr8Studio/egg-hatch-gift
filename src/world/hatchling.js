import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { COL } from '../core/state.js';
import { toon } from '../core/render.js';

// The Blender hatchling (public/hatchling.glb): one Mixamo armature, clips pose / jump / dance,
// materials Face (his photo), Eggshell (the egg's texture), Skin.001 (skin tone from the photo).
// If it fails to load, stage.js keeps the procedural hatchling instead.

export const SCALE = 1.8;       // the old procedural hatchling was about 3 units tall; the model is 1.7
const OUTLINE = 0.022;          // outline thickness in model units (before SCALE)
const JUMP_SPEED = 1;           // jump timeScale; 1.3 if it looks floaty

export const HL = { ok: false, root: null, mixer: null, act: {}, cur: null, head: null, skinMat: null };

// Outline shells for skinned meshes. Scaling a copy (what outline() does) grows from the feet, so on a
// body the head's outline would drift upward. Instead each vertex is pushed out along a normal that is
// averaged over every copy of that corner (hard edges have split normals, which would tear the shell open).
var outMat = null;
function skinnedOutlineMat() {
  if (outMat) return outMat;
  outMat = new THREE.MeshBasicMaterial({ color: COL.ink, side: THREE.BackSide, skinning: true });
  outMat.onBeforeCompile = function (s) {
    s.vertexShader = 'attribute vec3 onrm;\n' + s.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = vec3( position ) + onrm * ' + OUTLINE.toFixed(4) + ';');
  };
  return outMat;
}
function cornerNormals(geo) {
  var p = geo.attributes.position, n = geo.attributes.normal, sum = {}, out = new Float32Array(p.count * 3), v = new THREE.Vector3();
  var key = function (i) { return Math.round(p.getX(i) * 1e4) + ',' + Math.round(p.getY(i) * 1e4) + ',' + Math.round(p.getZ(i) * 1e4); };
  for (var i = 0; i < p.count; i++) { var k = key(i); (sum[k] = sum[k] || new THREE.Vector3()).add(v.set(n.getX(i), n.getY(i), n.getZ(i))); }
  for (var j = 0; j < p.count; j++) { var s = sum[key(j)].clone().normalize(); out[j * 3] = s.x; out[j * 3 + 1] = s.y; out[j * 3 + 2] = s.z; }
  geo.setAttribute('onrm', new THREE.BufferAttribute(out, 3));
}
function addOutline(mesh) {
  cornerNormals(mesh.geometry);
  var o = new THREE.SkinnedMesh(mesh.geometry, skinnedOutlineMat());
  o.bind(mesh.skeleton, mesh.bindMatrix); o.frustumCulled = false;
  o.position.copy(mesh.position); o.quaternion.copy(mesh.quaternion); o.scale.copy(mesh.scale);
  mesh.parent.add(o);
}

// glTF textures are not flipped (flipY false), unlike three's own geometry, so the face and hat get
// their own textures that read the same canvases as the procedural face and the egg.
function canvasTex(cv) {
  var t = new THREE.CanvasTexture(cv); t.flipY = false;
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t;
}

// Load the model into `parent`. Resolves true when ready, false if it failed.
export function loadHatchling(parent, faceCanvas, eggCanvas, skinHex) {
  return new Promise(function (resolve) {
    var url = import.meta.env.BASE_URL + 'hatchling.glb';
    if (import.meta.env.DEV && /[?&]noglb/.test(location.search)) url += '.missing'; // dev: test the fallback
    new GLTFLoader().load(url, function (gltf) {
      try { build(gltf, parent, faceCanvas, eggCanvas, skinHex); resolve(true); }
      catch (e) { console.warn('hatchling.glb could not be set up, using the fallback', e); resolve(false); }
    }, undefined, function (e) { console.warn('hatchling.glb did not load, using the fallback', e && e.message ? e.message : e); resolve(false); });
  });
}

function build(gltf, parent, faceCanvas, eggCanvas, skinHex) {
  var root = gltf.scene, meshes = [];
  HL.faceTex = canvasTex(faceCanvas); HL.hatTex = canvasTex(eggCanvas);
  HL.skinMat = toon(new THREE.Color(skinHex).getHex()); HL.skinMat.skinning = true;
  root.traverse(function (o) {
    if (!o.isMesh) return;
    var name = o.material.name, m;
    if (name === 'Face') {
      m = toon(0xffffff, HL.faceTex);
      // The face is a shallow wedge; with real normals the toon bands would split it down the middle.
      // Lit as if it points straight ahead, it gets one even shade that matches the skin around it.
      var nn = o.geometry.attributes.normal; for (var i = 0; i < nn.count; i++) nn.setXYZ(i, 0, 0, 1);
    } else if (/^Skin/.test(name)) m = HL.skinMat;
    else if (name === 'Eggshell') m = toon(0xffffff, HL.hatTex);
    else {
      // body colours come from a small palette image; show its colours as stored, like every other texture here
      var map = o.material.map;
      if (map) { map.encoding = THREE.LinearEncoding; map.magFilter = map.minFilter = THREE.NearestFilter; map.generateMipmaps = false; map.needsUpdate = true; }
      m = toon(o.material.color.getHex(), map);
    }
    m.skinning = !!o.isSkinnedMesh;
    o.material = m; o.frustumCulled = false; meshes.push({ mesh: o, face: name === 'Face' });
  });
  meshes.forEach(function (x) { if (x.mesh.isSkinnedMesh && !x.face) addOutline(x.mesh); });

  // Jump: Mixamo's jump also travels about 1 m forward and drifts sideways. Keep only the vertical.
  // The Hips track is in Blender's Z-up armature space: X sideways, Y forward, Z up.
  var jump = THREE.AnimationClip.findByName(gltf.animations, 'jump');
  if (jump) jump.tracks.forEach(function (t) {
    if (!/Hips\.position$/.test(t.name)) return;
    var v = t.values; for (var k = 0; k < v.length; k += 3) { v[k] = v[0]; v[k + 1] = v[1]; }
  });

  HL.mixer = new THREE.AnimationMixer(root);
  gltf.animations.forEach(function (c) { HL.act[c.name] = HL.mixer.clipAction(c); });
  if (HL.act.jump) { HL.act.jump.setLoop(THREE.LoopOnce, 1); HL.act.jump.clampWhenFinished = true; HL.act.jump.timeScale = JUMP_SPEED; }
  HL.head = root.getObjectByName('mixamorigHead');
  if (!HL.act.pose || !HL.act.jump || !HL.act.dance || !HL.head) throw new Error('missing clip or Head bone');

  root.scale.setScalar(SCALE); root.visible = false;
  parent.add(root); HL.root = root; HL.ok = true;
  play('pose');
}

// Switch clip, crossfading over `fade` seconds (0 = cut).
export function play(name, fade) {
  var a = HL.act[name]; if (!a || HL.cur === a) return;
  a.reset(); a.setEffectiveWeight(1); a.play();
  if (HL.cur) { if (fade) HL.cur.crossFadeTo(a, fade, false); else HL.cur.stop(); }
  HL.cur = a;
}
export function jumpLength() { return HL.act.jump ? HL.act.jump.getClip().duration / JUMP_SPEED : 0; }
// The dance bounces about 225 times a minute (two bounces a beat, so ~112 bpm). During the 136 bpm
// birthday rap it runs 1.21x faster so the bounce lands on the beat.
export const RAP_DANCE_SPEED = 136 / 112.5;
export function setDanceSpeed(s) { if (HL.act.dance) HL.act.dance.timeScale = s; }
export function setSkin(hex) { if (HL.skinMat) HL.skinMat.color.set(hex); }
export function refreshTextures() { if (HL.faceTex) HL.faceTex.needsUpdate = true; if (HL.hatTex) HL.hatTex.needsUpdate = true; }

// Middle of his face in world space (follows the head in whatever clip is playing).
var FACE_OFS = new THREE.Vector3(0, 23, 25); // Head bone space, armature units (cm)
export function facePos(out) { HL.head.updateWorldMatrix(true, false); return out.copy(FACE_OFS).applyMatrix4(HL.head.matrixWorld); }
