// התא כסוללה: ריכוזי יונים בפנים ובחוץ + כמה "שערים" פתוחים → המתח על הממברנה.
// משוואת גולדמן (GHK) בטמפרטורת גוף, עם אשלגן ונתרן בלבד (כלור הושמט לשם פשטות).
import { h, s, prefersReducedMotion } from '../lib/dom.js';
import { rng } from '../lib/signals.js';

const K_IN = 140, NA_IN = 15;     // מילימולר, בתוך תא עצב טיפוסי
const RTF = 61.5;                 // מ"ו לכל פי 10 בריכוז (37°C)

const state = { kOut: 5, naOut: 145, ratio: 0.04 };
const PRESETS = [
  { label: '🙂 תא במנוחה', kOut: 5, naOut: 145, ratio: 0.04 },
  { label: '⚡ שערי הנתרן נפתחו', kOut: 5, naOut: 145, ratio: 15 },
  { label: '🍌 יותר מדי אשלגן בדם', kOut: 15, naOut: 145, ratio: 0.04 },
  { label: '🌊 מעט נתרן בחוץ', kOut: 5, naOut: 40, ratio: 15 },
];

const nernst = (out, inn) => RTF * Math.log10(out / inn);
const ghk = ({ kOut, naOut, ratio }) => RTF * Math.log10((kOut + ratio * naOut) / (K_IN + ratio * NA_IN));

// ---------- פקדים ----------
const slider = (key, label, min, max, step, fmt, toVal = (x) => x, fromVal = (x) => x) => {
  const out = h('output');
  const input = h('input', { class: 'range', type: 'range', min, max, step, value: fromVal(state[key]) });
  input.addEventListener('input', () => { state[key] = toVal(Number(input.value)); update(); });
  return { el: h('label', { class: 'sim-field' }, h('span', { class: 'sim-label' }, label, ' ', out), input), out, input, fmt, key, fromVal };
};
const logRatio = (x) => 10 ** x;
const sliders = [
  slider('kOut', 'אשלגן בחוץ:', 1, 40, 1, (v) => `${v} מילימולר`),
  slider('naOut', 'נתרן בחוץ:', 20, 200, 5, (v) => `${v} מילימולר`),
  slider('ratio', 'שערי נתרן פתוחים (ביחס לאשלגן):', -2, 1.3, 0.01, (v) => (v < 0.1 ? 'מעט מאוד' : v < 1 ? 'חלק' : v < 5 ? 'הרבה' : 'כמעט כולם'), logRatio, Math.log10),
];

const presetRow = h('div', { class: 'chip-row', role: 'group', 'aria-label': 'מצבים מוכנים' },
  PRESETS.map((p) => h('button', { type: 'button', class: 'chip-btn', text: p.label,
    onclick: () => { Object.assign(state, p); sliders.forEach((sl) => { sl.input.value = sl.fromVal(state[sl.key]); }); update(); } })));

// ---------- ממברנה ----------
const W = 360, H = 260, MEM = 130;
const svg = s('svg', { direction: 'ltr', class: 'battery-svg', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'ממברנה של תא: מעל הקו — בחוץ, מתחת לקו — בפנים. נקודות צהובות הן נתרן, סגולות הן אשלגן.' });
svg.append(
  s('rect', { x: 0, y: 0, width: W, height: MEM - 9, class: 'bt-out' }),
  s('rect', { x: 0, y: MEM + 9, width: W, height: H - MEM - 9, class: 'bt-in' }),
  s('text', { x: W - 10, y: 20, class: 'bt-lbl', 'text-anchor': 'end' }, 'בחוץ'),
  s('text', { x: W - 10, y: H - 10, class: 'bt-lbl', 'text-anchor': 'end' }, 'בתוך התא'),
);
// שכבה כפולה של ממברנה
for (let x = 6; x < W; x += 12) {
  svg.append(s('circle', { cx: x, cy: MEM - 6, r: 4, class: 'bt-lipid' }), s('circle', { cx: x, cy: MEM + 6, r: 4, class: 'bt-lipid' }));
}
// תעלות: אשלגן (תמיד חלק פתוחות) ונתרן (כמה שפתוחות לפי הסליידר)
const channels = s('g');
svg.append(channels);
const kCh = [60, 200].map((x) => s('rect', { x: x - 7, y: MEM - 14, width: 14, height: 28, rx: 4, class: 'bt-ch bt-ch-k' }));
const naCh = [130, 270, 320].map((x) => s('rect', { x: x - 7, y: MEM - 14, width: 14, height: 28, rx: 4, class: 'bt-ch bt-ch-na' }));
channels.append(...kCh, ...naCh);

const dots = s('g', { class: prefersReducedMotion() ? '' : 'bt-jiggle' });
svg.append(dots);
const fluxK = s('path', { class: 'bt-flux bt-flux-k' });
const fluxNa = s('path', { class: 'bt-flux bt-flux-na' });
svg.append(fluxK, fluxNa);

function drawDots() {
  dots.replaceChildren();
  const r = rng(11);
  const place = (n, y0, y1, cls) => {
    for (let i = 0; i < n; i++) {
      dots.append(s('circle', { cx: 10 + r() * (W - 20), cy: y0 + r() * (y1 - y0), r: 4.2, class: cls, style: `animation-delay:${(-r() * 3).toFixed(2)}s` }));
    }
  };
  const k = 5; // נקודה לכל 5 מילימולר
  place(Math.round(state.kOut / k), 28, MEM - 18, 'bt-k');
  place(Math.round(state.naOut / k), 28, MEM - 18, 'bt-na');
  place(Math.round(K_IN / k), MEM + 18, H - 22, 'bt-k');
  place(Math.round(NA_IN / k), MEM + 18, H - 22, 'bt-na');
}

// ---------- מד מתח ----------
const gauge = s('svg', { direction: 'ltr', class: 'gauge', viewBox: '0 0 240 140', 'aria-hidden': 'true' });
const gx = (v) => 20 + ((v + 110) / 180) * 200; // ‎-110..+70 מ"ו
const arc = (v) => { const a = Math.PI * (1 - (v + 110) / 180); return [120 + 95 * Math.cos(a), 120 - 95 * Math.sin(a)]; };
gauge.append(s('path', { d: `M25 120 A95 95 0 0 1 215 120`, class: 'gauge-arc' }));
for (let v = -100; v <= 60; v += 20) {
  const [x, y] = arc(v), [x2, y2] = [120 + (x - 120) * 0.86, 120 + (y - 120) * 0.86];
  gauge.append(s('line', { x1: x, y1: y, x2, y2, class: 'gauge-tick' }), s('text', { x: 120 + (x - 120) * 0.72, y: 124 + (y - 120) * 0.72, class: 'gauge-num', 'text-anchor': 'middle' }, String(v)));
}
const markK = s('circle', { r: 5, class: 'gauge-ek' });
const markNa = s('circle', { r: 5, class: 'gauge-ena' });
const needle = s('line', { x1: 120, y1: 120, x2: 120, y2: 30, class: 'gauge-needle' });
gauge.append(markK, markNa, needle, s('circle', { cx: 120, cy: 120, r: 6, class: 'gauge-hub' }));
void gx;

const vOut = h('output', { class: 'big-num' });
const verdict = h('p', { class: 'battery-verdict', 'aria-live': 'polite' });
const legend = h('ul', { class: 'battery-legend' });

function update() {
  sliders.forEach((sl) => { sl.out.textContent = sl.fmt(state[sl.key]); });
  const v = ghk(state), ek = nernst(state.kOut, K_IN), ena = nernst(state.naOut, NA_IN);
  vOut.textContent = `${v > 0 ? '+' : ''}${Math.round(v)} מ"ו`;
  const a = Math.PI * (1 - (Math.max(-110, Math.min(70, v)) + 110) / 180);
  needle.setAttribute('x2', 120 + 88 * Math.cos(a)); needle.setAttribute('y2', 120 - 88 * Math.sin(a));
  const [kx, ky] = arc(Math.max(-110, ek)); markK.setAttribute('cx', kx); markK.setAttribute('cy', ky);
  const [nx, ny] = arc(Math.min(70, ena)); markNa.setAttribute('cx', nx); markNa.setAttribute('cy', ny);
  legend.replaceChildren(
    h('li', { class: 'lg-k' }, `מתח שהאשלגן "רוצה": ${Math.round(ek)} מ"ו`),
    h('li', { class: 'lg-na' }, `מתח שהנתרן "רוצה": +${Math.round(ena)} מ"ו`));
  // תעלות נתרן: כמה פתוחות
  const open = state.ratio < 0.1 ? 0 : state.ratio < 1 ? 1 : state.ratio < 5 ? 2 : 3;
  naCh.forEach((c, i) => c.classList.toggle('is-open', i < open));
  kCh.forEach((c) => c.classList.add('is-open'));
  // חיצים: אשלגן יוצא כשהמתח מעל EK, נתרן נכנס כשהמתח מתחת ל-ENa. עובי החץ ~ כוח × כמות שערים
  const fk = Math.max(0, v - ek), fna = Math.max(0, ena - v) * Math.min(1, state.ratio);
  fluxK.setAttribute('d', 'M60 150 V95 m-8 10 l8 -10 l8 10');
  fluxK.style.strokeWidth = (1 + fk / 12).toFixed(1); fluxK.style.opacity = fk > 2 ? 1 : 0.15;
  fluxNa.setAttribute('d', 'M130 95 V165 m-8 -10 l8 10 l8 -10');
  fluxNa.style.strokeWidth = (1 + fna / 12).toFixed(1); fluxNa.style.opacity = fna > 2 ? 1 : 0.15;

  verdict.textContent = v < -55 ? 'הצד הפנימי של התא שלילי — הסוללה טעונה ומוכנה. ככה נראה תא עצב במנוחה.'
    : v < 0 ? 'המתח קרוב לאפס — התא איבד חלק מהטעינה. תא עצב כזה עלול לירות בלי סיבה, או להפסיק לירות בכלל.'
    : 'הפנים נהיה חיובי! זה בדיוק מה שקורה בשיא של פוטנציאל פעולה, אלפית שנייה לפני שהשערים נסגרים.';
  drawDots();
}

const stage = h('div', { class: 'sim-stage' },
  h('div', { class: 'battery-readout' }, gauge, h('div', {}, h('span', { class: 'sim-label', text: 'המתח בתוך התא' }), vOut, legend)),
  svg,
  verdict);

document.getElementById('battery-lab').append(h('div', { class: 'sim' },
  h('div', { class: 'sim-controls' }, presetRow, ...sliders.map((sl) => sl.el),
    h('p', { class: 'muted small' }, `בתוך התא קבועים: אשלגן ${K_IN} ונתרן ${NA_IN} מילימולר. כל נקודה בציור = 5 מילימולר.`)),
  stage));
update();
