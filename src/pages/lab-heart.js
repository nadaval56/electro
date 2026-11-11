// הלב החשמלי: ציור סכמטי של הלב שבו רואים את הגל החשמלי עובר, מסונכרן עם אק"ג חי.
import { h, s, prefersReducedMotion } from '../lib/dom.js';
import { createLiveScope } from '../components/scope.js';
import { createLiveEcg } from '../lib/live-ecg.js';

const still = prefersReducedMotion() || document.documentElement.classList.contains('a11y-still');

// ---------- הציור ----------
const svg = s('svg', { class: 'heart-svg', viewBox: '0 0 300 320', role: 'img', 'aria-label': 'ציור סכמטי של הלב: שתי עליות למעלה, שני חדרים למטה, הקוצב הטבעי בעלייה הימנית, וחוטי ההולכה שיורדים במחיצה אל החדרים' });
const part = (d, cls) => s('path', { d, class: `hp ${cls}` });
const RA = part('M72 66 C40 68 28 110 44 142 L140 150 L140 78 C122 62 96 58 72 66 Z', 'hp-atrium');
const LA = part('M228 66 C260 68 272 110 256 142 L160 150 L160 78 C178 62 204 58 228 66 Z', 'hp-atrium');
const RV = part('M44 152 L140 160 L147 296 C106 274 56 222 44 152 Z', 'hp-vent');
const LV = part('M256 152 L160 160 L153 296 C198 270 246 222 256 152 Z', 'hp-vent');
const vessels = s('path', { d: 'M110 62 C110 30 120 14 132 8 M190 62 C192 34 200 20 214 14 M150 70 C150 40 160 24 176 20', class: 'hp-vessel' });
const bundle = s('path', { d: 'M150 152 V205 M150 205 C142 236 120 262 98 252 C80 240 66 205 62 172 M150 205 C158 236 180 262 202 252 C220 240 234 205 238 172', class: 'hp-wire' });
const atrialPath = s('path', { d: 'M86 72 C110 100 128 128 150 150 M86 72 C130 70 180 84 228 96', class: 'hp-wire hp-wire-a' });
const SA = s('circle', { cx: 86, cy: 72, r: 8, class: 'hp-node hp-sa' });
const AV = s('circle', { cx: 150, cy: 152, r: 7, class: 'hp-node hp-av' });
const label = (x, y, t, anchor = 'middle') => s('text', { x, y, class: 'hp-lbl', 'text-anchor': anchor }, t);
svg.append(vessels, RA, LA, RV, LV, atrialPath, bundle, SA, AV,
  label(86, 52, 'הקוצב הטבעי'), label(95, 118, 'עלייה'), label(208, 118, 'עלייה'),
  label(98, 215, 'חדר'), label(204, 215, 'חדר'), label(178, 168, 'צומת', 'start'), label(178, 182, 'העברה', 'start'));

const phase = h('p', { class: 'heart-phase', text: 'לחצו ▶ כדי להתחיל' });
const PHASES = {
  sa: 'הקוצב הטבעי יורה ניצוץ',
  atria: 'הגל עובר בעליות → גל P',
  av: 'עיכוב קטן בצומת ההעברה (כדי שהעליות יספיקו למלא את החדרים)',
  vent: 'הגל רץ בחדרים → QRS, והם מתכווצים ודוחפים דם!',
  rec: 'החדרים נטענים מחדש → גל T',
};
const setPhase = (k) => { phase.textContent = PHASES[k]; phase.dataset.phase = k; };
const on = (el, cls, ms) => { el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); };

// ---------- צליל (כבוי כברירת מחדל) ----------
let audio = null, sound = false;
function beep() {
  if (!sound) return;
  audio ??= new AudioContext();
  const o = audio.createOscillator(), g = audio.createGain();
  o.frequency.value = 880; o.type = 'sine';
  g.gain.setValueAtTime(0.0001, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.15, audio.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.12);
  o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.13);
}

let beatCount = 0;
const counter = h('output', { text: '0' });
const live = createLiveEcg({
  bpm: 72,
  onBeat: (b) => {
    beatCount++; counter.textContent = beatCount;
    const k = Math.min(1, b.rr / 0.45) * 1000; // אלפיות שנייה, מכווץ בלב מהיר
    const at = (t, fn) => setTimeout(fn, t * k);
    at(0, () => { setPhase('sa'); on(SA, 'is-on', 0.1 * k); });
    at(0.02, () => { setPhase('atria'); on(RA, 'is-on', 0.14 * k); on(LA, 'is-on', 0.14 * k); on(atrialPath, 'is-on', 0.12 * k); });
    at(0.12, () => { setPhase('av'); on(AV, 'is-on', 0.08 * k); });
    at(0.19, () => { setPhase('vent'); beep(); on(bundle, 'is-on', 0.1 * k); on(RV, 'is-on', 0.22 * k); on(LV, 'is-on', 0.22 * k); });
    at(0.42, () => { setPhase('rec'); on(RV, 'is-rec', 0.18 * k); on(LV, 'is-rec', 0.18 * k); });
  },
});

const scope = createLiveScope({
  fn: live.fn, window: 4, yMin: -0.6, yMax: 1.5, height: 180, color: '#ff8aa0',
  label: 'אק"ג חי של הלב בציור', autoplay: !still,
  scale: { t: 1, v: 1, tLabel: '1 שנייה', vLabel: '1 מ"ו' },
});

// ---------- פקדים ----------
const bpmOut = h('output');
const bpm = h('input', { class: 'range', type: 'range', min: 30, max: 200, step: 1, value: 72 });
const setBpm = (b) => { live.setBpm(b); bpmOut.textContent = `${b} בדקה`; if (b <= 200) bpm.value = b; };
bpm.addEventListener('input', () => setBpm(Number(bpm.value)));
const presets = [['😴 שינה', 55], ['🙂 מנוחה', 72], ['🏃 ריצה', 150], ['🐭 עכבר', 600], ['🐈 חתול', 150], ['🐘 פיל', 30]];
const presetRow = h('div', { class: 'chip-row', role: 'group', 'aria-label': 'קצב מוכן' },
  presets.map(([t, b]) => h('button', { type: 'button', class: 'chip-btn', text: t, onclick: () => { setBpm(b); if (!scope.running) scope.start(); } })));
const soundBtn = h('button', { type: 'button', class: 'chip-btn', 'aria-pressed': 'false', text: '🔈 צפצוף בכל פעימה',
  onclick: () => { sound = !sound; soundBtn.setAttribute('aria-pressed', String(sound)); if (sound) audio ??= new AudioContext(); } });
setBpm(72);

document.getElementById('heart-lab').append(h('div', { class: 'sim heart-sim' },
  h('div', { class: 'sim-controls' },
    h('div', { class: 'heart-figure' }, svg, phase),
    h('p', { class: 'muted small', text: 'בציור ימין ושמאל של הלב הפוכים — כמו כשמסתכלים על מישהו שעומד מולכם.' })),
  h('div', { class: 'sim-stage' },
    scope.el,
    presetRow,
    h('label', { class: 'sim-field' }, h('span', { class: 'sim-label' }, 'דופק: ', bpmOut), bpm),
    h('div', { class: 'btn-row' }, soundBtn, h('span', { class: 'muted' }, 'פעימות שנספרו: ', counter)))));
