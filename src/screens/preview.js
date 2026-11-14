import * as THREE from 'three';
import { camShot, camGo } from '../core/render.js';
import { showHero, showEgg, heroUsesModel, heroParts, setGiftFace, setFace, defaultFace } from '../world/stage.js';
import { facePos } from '../world/hatchling.js';
import { setScreen } from '../core/nav.js';

// The live preview inside the /make page: the game runs in a frame on /?preview, nothing is saved,
// and the page sends the face while it is being edited. Shows it on the real character, close up
// ('face', standing still) or from the home screen camera ('dance').
// Only messages from this same site are listened to.
var PV = { on: false, view: 'face' };
var fp = new THREE.Vector3(), fl = new THREE.Vector3();

export function startPreview() {
  PV.on = true; setScreen('preview'); setView('face');
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object') return;
    var d = e.data;
    if (d.type === 'hello') e.source.postMessage({ type: 'ready' }, location.origin);
    if (d.type === 'face' && d.face && d.tone) setGiftFace(d.face, d.tone);
    if (d.type === 'noface') setFace(defaultFace); // a gift without a photo gets the pixel face
    if (d.type === 'view') setView(d.view);
  });
  if (window.parent !== window) window.parent.postMessage({ type: 'ready' }, location.origin);
}

function setView(v) {
  PV.view = v === 'dance' ? 'dance' : 'face';
  showEgg(false); showHero(true, 1, PV.view === 'dance' ? 'dance' : 'pose');
  if (PV.view === 'dance') camGo('gift', 0.6);
}

// Every frame: keep the camera in front of the face (the model can finish loading after this starts).
export function previewStep() {
  if (!PV.on || PV.view !== 'face') return;
  if (heroUsesModel()) facePos(fl); else heroParts.head.getWorldPosition(fl);
  fp.set(fl.x, fl.y + 0.1, fl.z + 4.4); camShot(fp, fl, 0); // closer than the hatch close-up (7): the face is what's being edited
}
