import * as THREE from 'three';
import { COL } from '../core/state.js';
import { toon } from '../core/render.js';

// Grass tufts: fans of curved blades that sway in a wave rolling across the field.
export const windTufts = [];

// grass tufts around the platform edge
// curved, tapered blades: base at the origin, bending outward along local +x
var mkBladeGeo = function (h, w, bend) {
  var bg = new THREE.ConeGeometry(w, h, 3, 4); bg.translate(0, h / 2, 0);
  var bp = bg.attributes.position;
  for (var vi = 0; vi < bp.count; vi++) { var t = bp.getY(vi) / h; bp.setX(vi, bp.getX(vi) + bend * t * t); }
  bg.computeVertexNormals(); return bg;
};
var bladeGeos = [mkBladeGeo(0.62, 0.075, 0.24), mkBladeGeo(0.48, 0.07, 0.3), mkBladeGeo(0.74, 0.08, 0.18), mkBladeGeo(0.4, 0.065, 0.2)];
var bladeMats = [toon(COL.teal), toon(0x7fae7a), toon(COL.sageD), toon(0x9cc79a)];
// a tuft fans its blades out from one root, each at a random angle, tilt and height
export const makeTuft = function (n, sc) {
  var g = new THREE.Group(), blades = [], off = Math.random() * Math.PI * 2;
  for (var b = 0; b < n; b++) {
    var yaw = off + (b / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.9;
    var bl = new THREE.Mesh(bladeGeos[Math.floor(Math.random() * bladeGeos.length)], bladeMats[Math.floor(Math.random() * bladeMats.length)]);
    bl.rotation.set(0, yaw, -(0.12 + Math.random() * 0.38));
    bl.position.set(Math.cos(yaw) * 0.05, 0, -Math.sin(yaw) * 0.05);
    bl.scale.set(1, 0.75 + Math.random() * 0.6, 1);
    bl.userData = { rz: bl.rotation.z, ph: Math.random() * 6 };
    g.add(bl); blades.push(bl);
  }
  g.scale.setScalar(sc); g.userData = { ph: Math.random() * 6, pop: 0, blades: blades, base: sc };
  windTufts.push(g); return g;
};
