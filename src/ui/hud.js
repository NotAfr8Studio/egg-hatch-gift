import { $ } from '../core/dom.js';
import { st } from '../core/state.js';
import { save } from '../core/save.js';
import { setMute } from '../core/audio.js';
import { setMusicMuted } from '../core/music.js';
import { S } from '../strings.en.js';

// The egg's HP bar and count (HP = taps still to go).
export function hud() {
  save();
  var hp = Math.max(0, st.total - st.taps), f = hp / st.total, b = $('barfill');
  $('count').textContent = hp + '/' + st.total; b.style.width = (f * 100) + '%';
  b.style.backgroundColor = f > 0.5 ? '#5f8f94' : f > 0.2 ? '#e2b84f' : '#d97f7a';
}

export function setMuted(m) {
  setMute(m); setMusicMuted(m); var b = $('snd'); b.classList.toggle('muted', m); b.setAttribute('aria-label', m ? S.aria.soundOff : S.aria.soundOn);
}
