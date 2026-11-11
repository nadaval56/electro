// משחק: אתם הקוצב! מקישים בקצב שהגוף צריך. אם מפסיקים — הקוצב הגיבוי בחדרים נכנס לפעולה.
import { h } from '../lib/dom.js';
import { createLiveScope } from '../components/scope.js';
import { createLiveEcg } from '../lib/live-ecg.js';

const SCRIPT = [
  { from: 0, bpm: 70, text: '🙂 נועה יושבת ומציירת', short: 'מנוחה' },
  { from: 15, bpm: 100, text: '🚶 נועה הולכת מהר לאוטובוס', short: 'הליכה' },
  { from: 30, bpm: 130, text: '🏃 האוטובוס מגיע — רצים!', short: 'ריצה' },
  { from: 45, bpm: 80, text: '😮‍💨 התיישבה באוטובוס ונרגעת', short: 'מנוחה' },
];
const GAME = 60;
const ESCAPE = 1.6;   // שניות בלי פעימה עד שהקוצב הגיבוי (כ-40 בדקה) מתערב

const live = createLiveEcg({ auto: false });
let running = false, beats = [], score = [], escapes = 0, lastBeat = 0;

const target = h('output', { class: 'big-num' });
const yours = h('output', { class: 'big-num' });
const scene = h('p', { class: 'pm-scene' });
const meter = h('div', { class: 'pm-meter', 'aria-hidden': 'true' }, h('span', { class: 'pm-needle' }));
const status = h('p', { class: 'pm-status', 'aria-live': 'polite' });
const timeLeft = h('output');

const scope = createLiveScope({
  fn: live.fn, window: 5, yMin: -1, yMax: 1.6, height: 170, color: '#ff8aa0', autoplay: false, pauseOnClick: false,
  label: 'אק"ג של הפעימות שאתם יוצרים',
  onTick: (t) => tick(t),
});

const heartBtn = h('button', { type: 'button', class: 'pm-heart', 'aria-label': 'פעימה', disabled: true }, h('span', { 'aria-hidden': 'true', text: '❤' }));
const startBtn = h('button', { type: 'button', class: 'btn btn-primary', text: '▶ התחלת משחק (60 שניות)' });

const sceneAt = (t) => [...SCRIPT].reverse().find((s) => t >= s.from);

function beat() {
  if (!running) return;
  const t = scope.time;
  const rr = t - lastBeat;
  live.addBeat(t, 'sinus', Math.max(0.3, Math.min(rr, 1.5)));
  heartBtn.classList.remove('is-beat'); void heartBtn.offsetWidth; heartBtn.classList.add('is-beat');
  if (lastBeat > 0 && rr < 3) {
    const tr = 60 / sceneAt(t).bpm;
    score.push(Math.max(0, 1 - Math.abs(rr - tr) / tr * 2.5));
  }
  beats.push(t);
  lastBeat = t;
}

function tick(t) {
  if (!running) return;
  const sc = sceneAt(t);
  if (scene.textContent !== sc.text) { scene.textContent = sc.text; status.textContent = `עכשיו הגוף צריך כ-${sc.bpm} פעימות בדקה`; }
  target.textContent = sc.bpm;
  timeLeft.textContent = Math.max(0, Math.ceil(GAME - t));
  const recent = beats.filter((b) => t - b < 5);
  const rate = recent.length >= 2 ? Math.round(60 / ((recent[recent.length - 1] - recent[0]) / (recent.length - 1))) : 0;
  yours.textContent = rate || '—';
  const diff = rate ? Math.max(-1, Math.min(1, (rate - sc.bpm) / (sc.bpm * 0.4))) : -1;
  meter.style.setProperty('--d', diff);
  // הקוצב הגיבוי
  if (t - lastBeat > ESCAPE && t > 1) {
    live.addBeat(t, 'ventricular');
    lastBeat = t; escapes++;
    score.push(0);
    status.textContent = '⚠️ הפסקתם להקיש! הקוצב הגיבוי בחדרים נכנס לפעולה — פעימה רחבה ואיטית.';
  }
  if (t >= GAME) end();
}

function end() {
  running = false;
  scope.stop();
  heartBtn.disabled = true;
  startBtn.hidden = false; startBtn.textContent = '↻ עוד סיבוב';
  const avg = score.length ? score.reduce((a, b) => a + b, 0) / score.length : 0;
  const stars = avg > 0.8 ? 3 : avg > 0.6 ? 2 : avg > 0.3 ? 1 : 0;
  status.textContent = `${'⭐'.repeat(stars) || '💤'} דיוק: ${Math.round(avg * 100)}%. ${escapes ? `הקוצב הגיבוי נאלץ להתערב ${escapes} פעמים.` : 'הקוצב הגיבוי לא היה צריך להתערב אפילו פעם אחת!'} ` +
    'עכשיו תארו לעצמכם לעשות את זה כל החיים, גם בשינה — טוב שיש לנו קוצב טבעי שעושה את זה לבד.';
}

function start() {
  beats = []; score = []; escapes = 0; lastBeat = 0;
  live.beats.length = 0;
  scope.reset();
  running = true;
  heartBtn.disabled = false;
  startBtn.hidden = true;
  scope.start();
  heartBtn.focus();
}
startBtn.addEventListener('click', start);
heartBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); beat(); });
heartBtn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); beat(); } });
document.addEventListener('keydown', (e) => {
  if (running && e.key === ' ' && e.target === document.body && !e.repeat) { e.preventDefault(); beat(); }
});

document.getElementById('pacemaker-lab').append(h('div', { class: 'pm' },
  h('div', { class: 'pm-top' },
    h('div', { class: 'pm-stat' }, h('span', { class: 'sim-label', text: 'הגוף צריך' }), target, h('small', { text: 'בדקה' })),
    h('div', { class: 'pm-stat' }, h('span', { class: 'sim-label', text: 'אתם מקישים' }), yours, h('small', { text: 'בדקה' })),
    h('div', { class: 'pm-stat' }, h('span', { class: 'sim-label', text: 'נשארו' }), h('span', { class: 'big-num' }, timeLeft), h('small', { text: 'שניות' }))),
  scene,
  h('div', { class: 'pm-meter-wrap' }, h('span', { text: 'לאט מדי' }), meter, h('span', { text: 'מהר מדי' })),
  scope.el,
  h('div', { class: 'pm-controls' }, startBtn, heartBtn),
  h('p', { class: 'muted center small', text: 'הקישו על הלב (או על מקש הרווח) בכל פעימה.' }),
  status));
target.textContent = SCRIPT[0].bpm; yours.textContent = '—'; timeLeft.textContent = GAME; scene.textContent = SCRIPT[0].text;
