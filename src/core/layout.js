import { W, H } from './state.js';

// The screen is 144 x 288 grid cells. Pick the biggest cell size (--u, in CSS px) that fits the
// window AND lands on whole device pixels, so the pixel art stays sharp on a 3x iPhone too.
// #safe is an invisible element padded by the iPhone safe-area insets (notch, home bar).
export function layout() {
  var probe = document.getElementById('safe');
  var cs = probe ? getComputedStyle(probe) : null;
  var l = cs ? parseFloat(cs.paddingLeft) || 0 : 0, r = cs ? parseFloat(cs.paddingRight) || 0 : 0;
  var t = cs ? parseFloat(cs.paddingTop) || 0 : 0, b = cs ? parseFloat(cs.paddingBottom) || 0 : 0;
  var vw = window.innerWidth - l - r, vh = window.innerHeight - t - b, dpr = window.devicePixelRatio || 1;
  var fit = Math.min(vw / W, vh / H, 3);
  var u = Math.max(1 / dpr, Math.floor(fit * dpr) / dpr);
  document.documentElement.style.setProperty('--u', u + 'px');
}
export function initLayout() { layout(); window.addEventListener('resize', layout); window.addEventListener('orientationchange', layout); }
