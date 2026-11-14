import { st } from '../core/state.js';
import { beep } from '../core/audio.js';
import { save } from '../core/save.js';
import { say, talk, choose } from '../ui/dialog.js';
import { S } from '../strings.en.js';

// Pop quiz (30%): what came first? Runs on the tapping screen.
export function runQuiz() {
  beep(523, 0.08, 'square', 0.04); beep(659, 0.08, 'square', 0.04, 0.09); beep(784, 0.14, 'square', 0.04, 0.18);
  talk(S.quiz.intro, function () {
    choose(S.quiz.head, [['chicken', S.quiz.chicken], ['egg', S.quiz.egg]], function (k) {
      var lines = k === 'egg' ? S.quiz.right : S.quiz.wrong;
      if (k === 'egg') { [784, 988, 1175].forEach(function (f, i) { beep(f, 0.08, 'square', 0.035, i * 0.08); }); } else { beep(220, 0.2, 'sawtooth', 0.04); st.wig = 1.5; }
      talk(lines, function () { st.done.quiz = true; save(true); say(S.quiz.after); });
    }, 1);
  });
}
