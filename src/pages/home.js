import { h, prefersReducedMotion } from '../lib/dom.js';
import { createLiveScope } from '../components/scope.js';
import { createLiveEcg } from '../lib/live-ecg.js';
import { ICONS } from '../config.js';
import { MEDIA, mediaUrl } from '../data/media.js';

// ---------- מוניטור הלב בראש העמוד ----------
const bpmOut = document.getElementById('hero-bpm');
const heart = document.querySelector('.monitor-heart');
const still = prefersReducedMotion() || document.documentElement.classList.contains('a11y-still');
const live = createLiveEcg({
  bpm: 75,
  onBeat: () => {
    if (still) return;
    // הלב "קופץ" ברגע שהחדרים מתכווצים (בערך 0.2 שנייה אחרי תחילת הפעימה)
    setTimeout(() => { heart.classList.remove('is-beat'); void heart.offsetWidth; heart.classList.add('is-beat'); }, 200);
  },
});
const scope = createLiveScope({
  fn: live.fn, window: 4, yMin: -0.6, yMax: 1.5, height: 170, color: '#ff8aa0',
  label: 'מוניטור לב מדומה שמציג אק"ג בזמן אמת',
  scale: { t: 1, v: 1, tLabel: '1 שנייה', vLabel: '1 מ"ו' },
});
document.getElementById('hero-scope').append(scope.el);

for (const btn of document.querySelectorAll('.monitor-modes button')) {
  btn.addEventListener('click', () => {
    const target = Number(btn.dataset.bpm);
    document.querySelectorAll('.monitor-modes button').forEach((b) => b.classList.toggle('is-on', b === btn));
    // הלב לא קופץ בבת אחת — משנים את הקצב בהדרגה
    const from = live.bpm, t0 = performance.now(), dur = 2500;
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      const b = Math.round(from + (target - from) * k);
      live.setBpm(b);
      bpmOut.textContent = b;
      if (k < 1) requestAnimationFrame(tick);
    };
    tick();
    if (!scope.running) scope.start();
  });
}

// ---------- קוביות "מה יש באתר" ----------
const CARDS = [
  ['cases.html', 'התיקים', ICONS.cases, '11 תיקי חקירה: לב שנושם, מוח שישן, צמח שסופר וצלופח שצד.'],
  ['physics.html', 'איך זה עובד', ICONS.physics, 'מאיפה בא החשמל בגוף, איך הוא רץ בעצבים ואיך קוראים אק"ג.'],
  ['lab.html', 'המעבדה', ICONS.lab, 'שבעה סימולטורים ומשחקים: נוירון, לב, גלי מוח ועוד.'],
  ['nature.html', 'חשמל בטבע', ICONS.nature, 'צלופחים, כרישים, ברווזנים ודבורים — חיות שמרגישות ומייצרות חשמל.'],
  ['history.html', 'היסטוריה', ICONS.history, 'מצפרדע שרגלה קפצה ב-1780 ועד שבבים שקוראים מחשבות.'],
];
document.getElementById('home-cards').append(...CARDS.map(([href, title, icon, text]) => {
  const card = h('article', { class: 'card' }, h('div', { class: 'card-body' }));
  card.firstChild.innerHTML = `<svg class="card-icon" viewBox="0 0 36 36" aria-hidden="true">${icon}</svg>`;
  card.firstChild.append(h('h3', {}, h('a', { class: 'card-link', href: `./${href}`, text: title })), h('p', { text: text }));
  return card;
}));

// ---------- הידעתם? ----------
const FACTS = [
  ['🔋', 'כל תא עצב הוא סוללה קטנה', 'בתוך תא עצב במנוחה יש מתח של כ-70 אלפיות וולט (מינוס 70 מיליוולט). זה פי עשרים פחות מסוללת אצבע — אבל יש לכם עשרות מיליארדים כאלה.'],
  ['🏎️', 'מהר יותר ממכונית מרוץ', 'בעצבים המהירים ביותר האות רץ בכ-120 מטר לשנייה — יותר מ-400 קמ"ש.'],
  ['❤️', '100,000 פעימות ביום', 'הלב שלכם מייצר ניצוץ חשמלי בערך 100 אלף פעמים ביום, בלי הפסקה, מאז לפני שנולדתם.'],
  ['🧠', 'המוח זולל אנרגיה', 'המוח שוקל כ-2% ממשקל הגוף, אבל צורך כחמישית מהאנרגיה שלו — הרבה ממנה כדי לשמור על הסוללות הקטנות טעונות.'],
  ['⚡', '860 וולט', 'צלופח וולטה, שהתגלה ב-2019, מייצר פריקה של עד 860 וולט — כמעט פי ארבעה מהמתח בשקע בבית.'],
  ['🦆', 'הברווזן צד בעיניים עצומות', 'כשהברווזן צולל הוא סוגר עיניים, אוזניים ונחיריים, ומוצא את הטרף לפי השדה החשמלי של השרירים שלו.'],
  ['⌚', 'אק"ג על היד', 'יש שעונים חכמים שמודדים אק"ג: האצבע של היד השנייה סוגרת מעגל חשמלי דרך הגוף והלב.'],
  ['🐝', 'דבורים מרגישות פרחים', 'דבורי בומבוס מרגישות את השדה החשמלי של פרח, וכנראה גם לזהות פרח שדבורה אחרת ביקרה בו זה עתה.'],
];
document.getElementById('facts').append(...FACTS.map(([emoji, title, text]) =>
  h('article', { class: 'fact' }, h('span', { class: 'fact-emoji', 'aria-hidden': 'true', text: emoji }), h('h3', { text: title }), h('p', { text: text }))));

// ---------- מהארכיון ----------
const ARCHIVE = [
  ['galvani-frog-1791', '1791 · הצפרדע של גלווני', 'history.html#tl-galvani'],
  ['waller-jimmy', '1887 · ג\'ימי, הכלב עם האק"ג', 'history.html#tl-waller'],
  ['einthoven-leads', '1903 · ידיים ורגל בדליים', 'history.html#tl-einthoven'],
];
document.getElementById('archive').append(...ARCHIVE.map(([id, title, href]) => h('a', { class: 'archive-card', href: `./${href}` },
  h('img', { src: mediaUrl(MEDIA[id].file), alt: MEDIA[id].alt, loading: 'lazy', decoding: 'async' }),
  h('span', {}, h('strong', { text: title }), MEDIA[id].caption))));
