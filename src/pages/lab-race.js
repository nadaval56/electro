// מרוץ האותות: כמה זמן לוקח לאות להגיע למוח בסוגי עצבים שונים.
// מהירויות טיפוסיות (מטר לשנייה); בסיבים עם מעטפת מיאלין האות "קופץ" בין הפסקות שבמעטפת.
import { h, prefersReducedMotion } from '../lib/dom.js';

const FIBERS = [
  { id: 'motor', emoji: '🏎️', name: 'עצב תנועה עבה, עם מיאלין', job: 'פקודה לשריר, ותחושת מיקום הגוף', v: 100, myelin: true, color: 'var(--accent)' },
  { id: 'touch', emoji: '🖐️', name: 'עצב מגע, עם מיאלין', job: '"משהו נגע לי בבוהן"', v: 50, myelin: true, color: 'var(--brain)' },
  { id: 'squid', emoji: '🦑', name: 'האקסון הענק של הדיונון, בלי מיאלין', job: 'בריחה מהירה מטורף (עובי של כמעט מילימטר!)', v: 25, myelin: false, color: 'var(--spark)' },
  { id: 'pain', emoji: '🐌', name: 'עצב כאב דק, בלי מיאלין', job: 'כאב עמום ושורף שמגיע אחר כך', v: 1, myelin: false, color: 'var(--heart)' },
];
const DISTANCES = [
  { label: '🧒 ילד: מהבוהן למוח', m: 1 },
  { label: '🧑 מבוגר: מהבוהן למוח', m: 1.6 },
  { label: '🦒 ג\'ירפה: מהרגל האחורית למוח', m: 5 },
  { label: '🐋 לווייתן כחול: מהזנב למוח', m: 25 },
];
const SLOW = [{ label: 'זמן אמיתי', k: 1 }, { label: 'פי 10 לאט', k: 10 }, { label: 'פי 100 לאט', k: 100 }];
const state = { dist: 0, slow: 1 };

const fmt = (sec) => (sec < 1 ? `${Math.round(sec * 1000)} אלפיות שנייה` : `${sec.toFixed(sec < 10 ? 1 : 0)} שניות`);

const chipGroup = (label, items, key, text) => h('div', { class: 'chip-row', role: 'group', 'aria-label': label },
  items.map((it, i) => h('button', { type: 'button', class: 'chip-btn', 'aria-pressed': String(state[key] === i), text: text(it),
    onclick: (e) => { state[key] = i; e.target.parentElement.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === i))); reset(); } })));

const lanes = FIBERS.map((f) => {
  const runner = h('span', { class: 'race-runner', style: `--c:${f.color}`, 'aria-hidden': 'true' });
  const time = h('span', { class: 'race-time' });
  const track = h('div', { class: `race-track${f.myelin ? ' is-myelin' : ''}` }, runner);
  const el = h('li', { class: 'race-lane', style: `--c:${f.color}` },
    h('div', { class: 'race-info' }, h('strong', {}, `${f.emoji} ${f.name}`), h('span', { class: 'muted', text: `${f.job} · ${f.v} מ' לשנייה` })),
    h('div', { class: 'race-row' }, h('span', { class: 'race-end', 'aria-hidden': 'true', text: '🦶' }), track, h('span', { class: 'race-end', 'aria-hidden': 'true', text: '🧠' })),
    time);
  return { f, el, runner, time };
});

const startBtn = h('button', { type: 'button', class: 'btn btn-primary', text: '🏁 יריית פתיחה!' });
const clock = h('output', { class: 'race-clock', text: '0.000' });
const summary = h('p', { class: 'race-summary', 'aria-live': 'polite' });
let raf = 0;

function reset() {
  cancelAnimationFrame(raf);
  clock.textContent = '0.000';
  summary.textContent = '';
  for (const l of lanes) { l.runner.style.setProperty('--p', 0); l.time.textContent = ''; l.el.classList.remove('is-done'); }
}

function start() {
  reset();
  const d = DISTANCES[state.dist].m, k = SLOW[state.slow].k;
  const still = prefersReducedMotion() || document.documentElement.classList.contains('a11y-still');
  const finishAll = () => {
    for (const l of lanes) { l.runner.style.setProperty('--p', 1); l.time.textContent = fmt(d / l.f.v); l.el.classList.add('is-done'); }
    const slow = d / FIBERS[3].v, fast = d / FIBERS[1].v;
    summary.textContent = `המגע הגיע למוח אחרי ${fmt(fast)}, והכאב העמום — רק אחרי ${fmt(slow)}. לכן כשנתקלים ברגל של שולחן מרגישים קודם "בום", ורק אחר כך "איייי".`;
  };
  if (still) { finishAll(); clock.textContent = fmt(d / FIBERS[3].v); return; }
  const t0 = performance.now();
  const tick = (now) => {
    const t = (now - t0) / 1000 / k; // זמן אמיתי של האות
    clock.textContent = t.toFixed(3);
    let done = true;
    for (const l of lanes) {
      const total = d / l.f.v;
      let p = Math.min(1, t / total);
      // במיאלין האות קופץ מצומת לצומת (12 קפיצות לאורך המסלול)
      if (l.f.myelin && p < 1) p = Math.floor(p * 12) / 12;
      l.runner.style.setProperty('--p', p);
      if (t >= total && !l.el.classList.contains('is-done')) { l.el.classList.add('is-done'); l.time.textContent = `🏁 ${fmt(total)}`; }
      if (t < total) done = false;
    }
    if (done) { finishAll(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
startBtn.addEventListener('click', start);

document.getElementById('race-lab').append(h('div', { class: 'race' },
  h('div', { class: 'race-controls' },
    h('div', {}, h('p', { class: 'sim-label', text: 'מאיפה עד איפה?' }), chipGroup('מרחק', DISTANCES, 'dist', (x) => `${x.label} (${x.m} מ')`)),
    h('div', {}, h('p', { class: 'sim-label', text: 'מהירות ההצגה' }), chipGroup('הילוך', SLOW, 'slow', (x) => x.label)),
    h('div', { class: 'btn-row' }, startBtn, h('span', { class: 'race-clock-wrap' }, 'זמן: ', clock, ' שניות'))),
  h('ol', { class: 'race-lanes' }, lanes.map((l) => l.el)),
  summary));
