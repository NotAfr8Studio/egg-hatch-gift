import { st } from './state.js';
import { muted } from './audio.js';

// localStorage save, always wrapped in try/catch. Every gift link saves under its own key, so two
// gifts (or a test run of your own gift) on one phone never share progress. The /make preview
// saves nothing.
var SAVE = 'egg-save-own';
export var canSave = false;
var saveT = null;
try { localStorage.setItem('egg-test', '1'); localStorage.removeItem('egg-test'); canSave = true; } catch (e) { canSave = false; }
export function useSaveKey(id) { if (id === 'preview') canSave = false; else SAVE = 'egg-save-' + id; }

export function save(now) {
  if (!canSave) return;
  var w = function () { try { localStorage.setItem(SAVE, JSON.stringify({ v: 1, taps: st.taps, total: st.total, done: st.done, errorShown: st.errorShown, unlocked: st.unlocked, best: st.best, muted: muted, afterError: st.afterError })); } catch (e) {} };
  clearTimeout(saveT); if (now) w(); else saveT = setTimeout(w, 300);
}
export function loadSave() { if (!canSave) return null; try { return JSON.parse(localStorage.getItem(SAVE) || 'null'); } catch (e) { return null; } }
export function clearSave() { try { localStorage.removeItem(SAVE); } catch (e) {} }

export function recordBest(k, v, higher) {
  var b = st.best[k], better = b == null || (higher ? v > b : v < b);
  if (better) { st.best[k] = higher ? v : Math.round(v * 10) / 10; save(true); }
  return better && b != null;
}
