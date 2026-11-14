import * as THREE from 'three';
import { $ } from './dom.js';
import { W, H, COL, fx } from './state.js';

// Renderer at low resolution (144 x 288 x pixel scale), scaled up by CSS with pixelated rendering.
export var ok = true;
export var renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: false }); }
catch (e) { ok = false; $('nogl').style.display = 'flex'; }

export var scale = 1;
export function setRes(s) { scale = s; if (ok) renderer.setSize(Math.round(W * s), Math.round(H * s), false); }
if (ok) { renderer.setPixelRatio(1); setRes(1); }

// The main scene (meadow, platform, egg). The runner and chase worlds are their own scenes.
export const scene = new THREE.Scene();
scene.background = new THREE.Color(COL.sky); scene.fog = new THREE.Fog(COL.sky, 24, 52);
export const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);
camera.position.set(0, 5.4, 20);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 0.5); sun.position.set(-4, 8, 6); scene.add(sun);

// Which scene and camera get drawn right now.
export const view = { scene: scene, cam: camera };

// Toon look: a 3-step gradient map (RGBA, not Luminance: that broke on some GPUs) and plum outline shells.
export const grad = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.generateMipmaps = false; grad.needsUpdate = true;
export const outMat = new THREE.MeshBasicMaterial({ color: COL.ink, side: THREE.BackSide });
export const toon = function (c, map) { return new THREE.MeshToonMaterial({ color: c, gradientMap: grad, map: map || null }); };
export const outline = function (mesh, k) { var o = new THREE.Mesh(mesh.geometry, outMat); o.scale.setScalar(k || 1.07); mesh.add(o); return mesh; };

// Camera moves between named shots with an ease in/out.
export const CAM = { front: [0, 5.4, 20, 0, 2.4, 0], gift: [0, 5.4, 20, 0, 2.0, 0], top: [0, 30, 0.8, 0, 0, 0], clean: [0, 3.6, 12.5, 0, 2.3, 0], enc: [0, 8.6, 16, 0.6, 1.4, -2] };
const cam = { p: new THREE.Vector3(0, 5.4, 20), l: new THREE.Vector3(0, 2.4, 0), fp: new THREE.Vector3(), fl: new THREE.Vector3(), tp: new THREE.Vector3(), tl: new THREE.Vector3(), t: 1, d: 0.5 };
export function camGo(name, d) {
  if (!ok) return; var c = CAM[name];
  if (cam.t >= 1 && cam.p.distanceTo(cam.tp.set(c[0], c[1], c[2])) < 0.01 && cam.l.distanceTo(cam.tl.set(c[3], c[4], c[5])) < 0.01) return;
  cam.fp.copy(cam.p); cam.fl.copy(cam.l); cam.tp.set(c[0], c[1], c[2]); cam.tl.set(c[3], c[4], c[5]); cam.t = 0; cam.d = d || 0.5;
}
// A shot worked out at runtime (e.g. his face). d = 0 cuts straight to it.
export function camShot(p, l, d) {
  if (!ok) return;
  cam.tp.copy(p); cam.tl.copy(l);
  if (!d) { cam.p.copy(p); cam.l.copy(l); cam.t = 1; return; }
  cam.fp.copy(cam.p); cam.fl.copy(cam.l); cam.t = 0; cam.d = d;
}
export function cameraStep(dt) {
  if (cam.t < 1) {
    cam.t = Math.min(1, cam.t + dt / cam.d);
    var ce = cam.t < 0.5 ? 4 * cam.t * cam.t * cam.t : 1 - Math.pow(-2 * cam.t + 2, 3) / 2;
    cam.p.lerpVectors(cam.fp, cam.tp, ce); cam.l.lerpVectors(cam.fl, cam.tl, ce);
  }
  fx.shake *= Math.pow(0.002, dt);
  camera.position.set(cam.p.x + (Math.random() - 0.5) * fx.shake, cam.p.y + (Math.random() - 0.5) * fx.shake, cam.p.z);
  camera.lookAt(cam.l);
}
