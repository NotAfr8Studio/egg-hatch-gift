import { GIFT } from '../config.js';

// The game screen is a 144 x 288 "pixel" grid. The UI scales it by an integer --u.
export const W = 144, H = 288;

export const COL = { ink: 0x2b2437, cream: 0xf7efd6, sage: 0xb9d29f, sageD: 0x8fb184, sageL: 0xd3e5b4, sky: 0xcfe6e1, rose: 0xe9a5a0, butter: 0xf3d98b, teal: 0x5f8f94, skin: 0xf1c9a5, blue: 0x9fc5d6 };

// The one shared game state. Saved fields: taps, total, done, errorShown, unlocked, best, afterError.
export const st = {
  screen: 'start', taps: 0, total: GIFT.taps, errorAt: Math.round(GIFT.taps * 0.95), errorShown: false,
  done: {}, unlocked: false, best: {}, arcade: null, afterError: false,
  contNext: null, hatchT: -1, step: 0, stage: 0, wig: 0, squash: 0, milestone: -1,
};
// The gift link decides the total; main.js calls this before the game starts.
export function setTotal(n) { st.total = n; st.errorAt = Math.round(n * 0.95); }

// Shared scalars that several modules change every frame.
export const fx = { shake: 0, clock: 0 };

// Mini games that interrupt the tapping, by share of total taps. Trigger with >=, never ===.
export const EVENTS = [['snake', 0.2], ['run', 0.4], ['enc', 0.6], ['clean', 0.8], ['chase', 0.9]];
export function evTap(k) { for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i][0] === k) return Math.round(st.total * EVENTS[i][1]); return -1; }
export function setDoneBy(t, incl) { EVENTS.concat([['quiz', 0.3]]).forEach(function (e) { var at = Math.round(st.total * e[1]); st.done[e[0]] = incl ? t >= at : t > at; }); }
export function stageFor(n) { var f = n / st.total; return f >= 0.9 ? 4 : f >= 0.75 ? 3 : f >= 0.5 ? 2 : f >= 0.25 ? 1 : 0; }
export function pendingEvent() {
  for (var i = 0; i < EVENTS.length; i++) { var k = EVENTS[i][0]; if (st.taps >= evTap(k) && !st.done[k]) return k; }
  if (st.taps >= st.errorAt && !st.errorShown) return 'error';
  if (st.taps >= st.total) return 'hatch';
  return null;
}
