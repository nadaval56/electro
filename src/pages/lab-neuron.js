// נוירון במעבדה: מודל הודג'קין-האקסלי (1952) של האקסון הענק של הדיונון — המודל האמיתי, לא קירוב.
// הזמן במילישניות, המתח במיליוולט, הזרם במיקרו-אמפר לסמ"ר.
import { h } from '../lib/dom.js';
import { createScope, COLORS } from '../components/scope.js';

const G_NA = 120, G_K = 36, G_L = 0.3, E_NA = 50, E_K = -77, E_L = -54.387;
const T_END = 50, DT = 0.01;

const safe = (x, f) => (Math.abs(x) < 1e-7 ? f : x);
const an = (v) => (0.01 * safe(v + 55, 1e-7)) / (1 - Math.exp(-safe(v + 55, 1e-7) / 10));
const bn = (v) => 0.125 * Math.exp(-(v + 65) / 80);
const am = (v) => (0.1 * safe(v + 40, 1e-7)) / (1 - Math.exp(-safe(v + 40, 1e-7) / 10));
const bm = (v) => 4 * Math.exp(-(v + 65) / 18);
const ah = (v) => 0.07 * Math.exp(-(v + 65) / 20);
const bh = (v) => 1 / (1 + Math.exp(-(v + 35) / 10));

function simulate(stim) {
  let v = -65;
  let m = am(v) / (am(v) + bm(v)), n = an(v) / (an(v) + bn(v)), hh = ah(v) / (ah(v) + bh(v));
  const N = Math.round(T_END / DT);
  const V = new Float32Array(N + 1), GNA = new Float32Array(N + 1), GK = new Float32Array(N + 1);
  for (let i = 0; i <= N; i++) {
    const t = i * DT;
    const gna = G_NA * m ** 3 * hh, gk = G_K * n ** 4;
    V[i] = v; GNA[i] = gna; GK[i] = gk;
    const I = stim(t);
    const dv = I - gna * (v - E_NA) - gk * (v - E_K) - G_L * (v - E_L);
    m += DT * (am(v) * (1 - m) - bm(v) * m);
    n += DT * (an(v) * (1 - n) - bn(v) * n);
    hh += DT * (ah(v) * (1 - hh) - bh(v) * hh);
    v += DT * dv;
  }
  return { V, GNA, GK };
}
const sampler = (arr) => (t) => {
  const x = Math.max(0, Math.min(arr.length - 2, t / DT));
  const i = Math.floor(x), f = x - i;
  return arr[i] * (1 - f) + arr[i + 1] * f;
};

const MODES = {
  one: { label: '👉 דחיפה אחת', help: 'דחיפה קצרה של אלפית שנייה. מצאו את החוזק הכי קטן שגורם לתא לירות.' },
  two: { label: '👉👉 שתי דחיפות', help: 'שתי דחיפות זהות. קרבו אותן זו לזו — מתי השנייה כבר לא עובדת?' },
  hold: { label: '✋ לחיצה ארוכה', help: 'זרם קבוע לאורך 40 אלפיות שנייה. מה קורה למספר הקוצים כשמחזקים?' },
};
const state = { mode: 'one', amp: 10, gap: 12 };

const ampOut = h('output'), gapOut = h('output');
const amp = h('input', { class: 'range', type: 'range', min: 0, max: 40, step: 0.5, value: state.amp });
const gap = h('input', { class: 'range', type: 'range', min: 2, max: 25, step: 0.5, value: state.gap });
const gapField = h('label', { class: 'sim-field' }, h('span', { class: 'sim-label' }, 'זמן בין הדחיפות: ', gapOut), gap);
const help = h('p', { class: 'muted' });
const modeBtns = Object.entries(MODES).map(([k, m]) => h('button', { type: 'button', class: 'chip-btn', text: m.label, 'aria-pressed': String(k === state.mode),
  onclick: () => { state.mode = k; if (k === 'hold' && state.amp > 20) { state.amp = 8; amp.value = 8; } run(); } }));

const result = h('div', { class: 'neuron-result', role: 'status', 'aria-live': 'polite' });

const vScope = createScope({
  duration: T_END, yMin: -90, yMax: 60, height: 220, grid: { x: 1, y: 10, major: 5 },
  scale: { t: 5, v: 50, tLabel: '5 אלפיות שנייה', vLabel: '50 מ"ו' },
  label: 'גרף המתח בתוך תא העצב לאורך 50 אלפיות שנייה', tag: 'המתח בתוך התא',
  hlines: [{ v: -65, label: 'מנוחה', color: 'rgba(232,236,241,.35)' }, { v: -55, label: 'סף (בערך)', color: 'rgba(255,209,102,.55)' }],
  fn: () => -65,
});
const gScope = createScope({
  duration: T_END, yMin: -2, yMax: 42, height: 120, grid: { x: 1, y: 10, major: 5 },
  label: 'כמה שערי נתרן (צהוב) ואשלגן (סגול) פתוחים לאורך הזמן', tag: 'שערים פתוחים',
  traces: [],
});

function stimFn() {
  const a = state.amp;
  if (state.mode === 'one') return (t) => (t >= 5 && t < 6 ? a : 0);
  if (state.mode === 'two') return (t) => ((t >= 5 && t < 6) || (t >= 5 + state.gap && t < 6 + state.gap) ? a : 0);
  return (t) => (t >= 5 && t < 45 ? a : 0);
}

function run() {
  ampOut.textContent = `${state.amp}`;
  gapOut.textContent = `${state.gap} אלפיות שנייה`;
  gapField.hidden = state.mode !== 'two';
  help.textContent = MODES[state.mode].help;
  modeBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(Object.keys(MODES)[i] === state.mode)));
  amp.max = state.mode === 'hold' ? 20 : 40;

  const stim = stimFn();
  const { V, GNA, GK } = simulate(stim);
  // ספירת קוצים: מעבר של 0 מ"ו כלפי מעלה
  const spikes = [];
  for (let i = 1; i < V.length; i++) if (V[i - 1] < 0 && V[i] >= 0) spikes.push(i * DT);

  vScope.set({ fn: sampler(V) });
  vScope.clearHighlights();
  const pulses = state.mode === 'one' ? [[5, 6]] : state.mode === 'two' ? [[5, 6], [5 + state.gap, 6 + state.gap]] : [[5, 45]];
  for (const [a, b] of pulses) vScope.highlight({ from: a, to: Math.max(b, a + 0.6), label: state.mode === 'hold' ? 'זרם קבוע' : 'דחיפה', fill: 'rgba(94,230,168,.08)', stroke: 'rgba(94,230,168,.45)' });
  gScope.set({ traces: [{ fn: sampler(GNA), color: COLORS.spark }, { fn: sampler(GK), color: COLORS.brain }] });

  let msg;
  if (state.mode === 'one') {
    msg = spikes.length
      ? ['⚡ התא ירה!', `הדחיפה העבירה את המתח מעל הסף, ושערי הנתרן נפתחו בבת אחת. נסו דחיפה חזקה יותר — הקוץ יהיה כמעט באותו גובה.`]
      : ['😴 התא לא ירה', 'הדחיפה הזיזה את המתח קצת, אבל לא מעבר לסף. חזקו אותה.'];
  } else if (state.mode === 'two') {
    msg = spikes.length >= 2
      ? ['⚡⚡ שני קוצים', 'הדחיפה השנייה הגיעה אחרי שהתא כבר התאושש.']
      : spikes.length === 1
        ? ['⚡ רק קוץ אחד', 'הדחיפה השנייה הגיעה מוקדם מדי: שערי הנתרן עוד "נעולים" אחרי הקוץ הראשון. זו התקופה העמידה (רפרקטורית) — היא דואגת שהאות ירוץ רק קדימה.']
        : ['😴 אין קוצים', 'שתי הדחיפות חלשות מדי. חזקו אותן.'];
  } else {
    const rate = spikes.length > 1 ? Math.round(1000 / ((spikes[spikes.length - 1] - spikes[0]) / (spikes.length - 1))) : 0;
    msg = spikes.length > 1
      ? [`⚡ ${spikes.length} קוצים`, `בערך ${rate} קוצים בשנייה. ככה תא עצב אומר "חזק": לא קוצים גבוהים יותר — יותר קוצים.`]
      : spikes.length === 1 ? ['⚡ קוץ אחד', 'מספיק לקוץ אחד, אבל לא לרצף. חזקו קצת.'] : ['😴 אין קוצים', 'הזרם חלש מדי. חזקו אותו.'];
  }
  result.replaceChildren(h('strong', { text: msg[0] }), h('p', { text: msg[1] }));
}

amp.addEventListener('input', () => { state.amp = Number(amp.value); run(); });
gap.addEventListener('input', () => { state.gap = Number(gap.value); run(); });

document.getElementById('neuron-lab').append(h('div', { class: 'sim sim-wide' },
  h('div', { class: 'sim-controls' },
    h('div', { class: 'chip-row', role: 'group', 'aria-label': 'סוג הגירוי' }, modeBtns),
    help,
    h('label', { class: 'sim-field' }, h('span', { class: 'sim-label' }, 'חוזק הדחיפה: ', ampOut), amp),
    gapField,
    result),
  h('div', { class: 'sim-stage' }, vScope.el, gScope.el,
    h('p', { class: 'legend-row' }, h('span', { class: 'lg-na', text: 'שערי נתרן (נכנס פנימה ומעלה את המתח)' }), h('span', { class: 'lg-k', text: 'שערי אשלגן (יוצא החוצה ומחזיר את המתח למטה)' })))));
run();
