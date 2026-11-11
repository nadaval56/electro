// גלי מוח: בוחרים מצב, והאות "מחליף מנגינה" בהדרגה. ליד המוניטור — כמה חזקה כל רצועת תדר.
import { h } from '../lib/dom.js';
import { createLiveScope } from '../components/scope.js';
import { BANDS, rng, smoothNoise } from '../lib/signals.js';

const STATES = [
  { id: 'focus', emoji: '🎯', label: 'פותרים תרגיל', mix: { beta: 22, alpha: 6, theta: 6, delta: 4 },
    text: 'גלים קטנים, מהירים ולא מסודרים — גלי בטא. כל קבוצה של תאי עצב עסוקה במשהו אחר, והחשמל שלהן לא מצטבר לגל גדול.' },
  { id: 'calm', emoji: '😌', label: 'עיניים עצומות, רגועים', mix: { alpha: 55, beta: 6, theta: 6, delta: 4 },
    text: 'גלים סדירים, כעשרה בשנייה — גלי אלפא. הם הכי חזקים בחלק האחורי של הראש, באזור הראייה, כשהעיניים עצומות.' },
  { id: 'drowsy', emoji: '🥱', label: 'נרדמים', mix: { theta: 45, alpha: 12, beta: 5, delta: 12 },
    text: 'האלפא נעלמים ומופיעים גלי תטא, איטיים יותר (4–8 בשנייה). זה השלב שבו לפעמים "נופלים" ומתעוררים בבהלה.' },
  { id: 'deep', emoji: '😴', label: 'שינה עמוקה', mix: { delta: 95, theta: 14, alpha: 3, beta: 2 },
    text: 'גלים ענקיים ואיטיים — גלי דלתא, פחות מ-4 בשנייה. המון תאים פועלים יחד באותו קצב. בשלב הזה הכי קשה להעיר מישהו.' },
  { id: 'rem', emoji: '💭', label: 'חולמים (REM)', mix: { theta: 28, beta: 14, alpha: 8, delta: 6 },
    text: 'מפתיע: בזמן חלום המוח נראה כמעט כמו מוח ער! גלים קטנים ומעורבבים. העיניים זזות מהר מתחת לעפעפיים, והשרירים משותקים — כדי שלא נקום ונמלא את החלום.' },
];

// מתנדים לכל רצועה, ומשקלות שמשתנים בהדרגה לכיוון המצב שנבחר
const r = rng(77);
const osc = {};
for (const [k, b] of Object.entries(BANDS)) osc[k] = b.f.map((f, i) => ({ f, ph: r() * 6.283, mod: smoothNoise(100 + i + k.length * 11, 0.7 + f * 0.05) }));
const noise = smoothNoise(321, 80);
let goal = STATES[1].mix;
const w = { ...goal };
let lastT = 0;

function fn(t) {
  const dt = Math.max(0, t - lastT); lastT = t;
  const k = Math.min(1, dt / 1.2);
  for (const b in w) w[b] += ((goal[b] ?? 0) - w[b]) * k;
  let v = 0;
  for (const b in osc) {
    let sum = 0;
    for (const o of osc[b]) sum += Math.sin(6.283 * o.f * t + o.ph) * (0.6 + 0.4 * o.mod(t));
    v += (w[b] * sum) / 2.2;
  }
  return v + 4 * noise(t);
}

const scope = createLiveScope({
  fn, window: 4, yMin: -120, yMax: 120, height: 200, color: '#c4b2ff', grid: { x: 0.2, y: 10 },
  label: 'גלי מוח מדומים בזמן אמת', scale: { t: 1, v: 50, tLabel: '1 שנייה', vLabel: '50 מיקרו-וולט' },
});

const bars = Object.entries(BANDS).map(([k, b]) => {
  const fill = h('span', { class: `bw-fill bw-${k}` });
  const row = h('li', { class: 'bw-row' }, h('span', { class: 'bw-name' }, h('strong', { text: b.label }), h('small', { text: `${b.range} בשנייה` })), h('span', { class: 'bw-track' }, fill));
  return { k, fill, row };
});
const desc = h('p', { class: 'bw-desc', 'aria-live': 'polite' });

function choose(st, btns, play = true) {
  goal = st.mix;
  desc.textContent = `${st.emoji} ${st.text}`;
  btns.forEach((b, i) => b.setAttribute('aria-pressed', String(STATES[i] === st)));
  if (play && !scope.running) scope.start();
}
const btns = STATES.map((st) => h('button', { type: 'button', class: 'chip-btn', text: `${st.emoji} ${st.label}` }));
btns.forEach((b, i) => b.addEventListener('click', () => choose(STATES[i], btns)));

// עדכון העמודות בקצב נמוך
setInterval(() => { for (const b of bars) b.fill.style.width = `${Math.min(100, (w[b.k] / 95) * 100)}%`; }, 150);

document.getElementById('brainwaves-lab').append(h('div', { class: 'sim sim-wide' },
  h('div', { class: 'sim-controls' },
    h('p', { class: 'sim-label', text: 'מה המוח עושה עכשיו?' }),
    h('div', { class: 'chip-row', role: 'group', 'aria-label': 'מצב' }, btns),
    desc),
  h('div', { class: 'sim-stage' }, scope.el,
    h('div', {}, h('p', { class: 'sim-label', text: 'כמה חזקה כל "מנגינה"' }), h('ul', { class: 'bw-bars' }, bars.map((b) => b.row))))));
choose(STATES[1], btns, false);
