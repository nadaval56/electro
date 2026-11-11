// שאלה אמריקאית עם משוב לכל תשובה. תשובה שגויה ננעלת ומציגה הסבר קצר למה היא לא נכונה;
// אחרי MISSES_BEFORE_ANSWER טעויות מופיע כפתור "הצגת התשובה".
// סדר התשובות מעורבב בכל טעינה, כדי שלא יהיה "תמיד הראשונה".

import { h } from '../lib/dom.js';

const MISSES_BEFORE_ANSWER = 2;

/**
 * @param {object} opts
 * @param {string} opts.question
 * @param {Array<{text:string, correct?:boolean, feedback?:string}>} opts.options
 * @param {string} opts.id   מזהה ייחודי בעמוד (לכותרת ולקבוצת הכפתורים)
 * @param {(result:{attempts:number, gaveUp:boolean}) => void} [opts.onDone]
 */
export function createQuiz({ question, options, id, onDone }) {
  let attempts = 0;
  let done = false;

  const shuffled = options.map((o, i) => ({ ...o, i }))
    .map((o) => ({ o, k: Math.random() }))
    .sort((a, b) => a.k - b.k)
    .map(({ o }) => o);

  const feedback = h('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
  const reveal = h('button', { type: 'button', class: 'btn btn-ghost', hidden: true, text: 'הצגת התשובה' });

  const buttons = shuffled.map((o) => {
    const btn = h('button', { type: 'button', class: 'quiz-option' }, h('span', { text: o.text }));
    btn.addEventListener('click', () => choose(o, btn));
    return btn;
  });

  const el = h('div', { class: 'quiz' },
    h('p', { class: 'quiz-question', id: `${id}-q`, text: question }),
    h('div', { class: 'quiz-options', role: 'group', 'aria-labelledby': `${id}-q` }, buttons),
    feedback,
    h('div', { class: 'btn-row quiz-actions' }, reveal),
  );

  function finish(gaveUp) {
    done = true;
    reveal.hidden = true;
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (shuffled[i].correct) b.classList.add('is-correct');
    });
    onDone?.({ attempts, gaveUp });
  }

  function choose(o, btn) {
    if (done) return;
    attempts++;
    if (o.correct) {
      feedback.className = 'feedback is-hit';
      feedback.textContent = o.feedback ? `נכון! ${o.feedback}` : 'נכון!';
      finish(false);
      return;
    }
    btn.disabled = true;
    btn.classList.add('is-wrong');
    feedback.className = 'feedback is-miss';
    feedback.textContent = o.feedback ? `לא. ${o.feedback}` : 'לא. נסו שוב.';
    if (attempts >= MISSES_BEFORE_ANSWER) reveal.hidden = false;
  }

  reveal.addEventListener('click', () => {
    const right = shuffled.find((o) => o.correct);
    feedback.className = 'feedback is-near';
    feedback.textContent = `התשובה: ${right.text}. ${right.feedback ?? ''}`.trim();
    finish(true);
  });

  return { el, get done() { return done; }, focus: () => buttons.find((b) => !b.disabled)?.focus() };
}
