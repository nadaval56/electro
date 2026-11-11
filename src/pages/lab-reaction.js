// כמה מהר אתם? מדידת זמן תגובה, והשוואה לזמן שהאות באמת מבלה בעצבים.
import { h } from '../lib/dom.js';

const TRIES = 5;
const NERVE_PATH = 1.2;   // מטר בערך: מהעין למוח, ומהמוח דרך חוט השדרה עד אצבע
const NERVE_SPEED = 60;   // מטר לשנייה, ממוצע גס של עצבים עם מיאלין

let state = 'idle', timer = 0, t0 = 0;
const results = [];

const pad = h('button', { type: 'button', class: 'reaction-pad is-idle' },
  h('span', { class: 'reaction-big', text: 'לחצו כדי להתחיל' }),
  h('span', { class: 'reaction-small', text: 'כשהמסך יהפוך לירוק — לחצו הכי מהר שאפשר (גם מקש רווח עובד)' }));
const list = h('ol', { class: 'reaction-list' });
const analysis = h('div', { class: 'reaction-analysis', 'aria-live': 'polite' });

function set(cls, big, small) {
  pad.className = `reaction-pad ${cls}`;
  pad.firstChild.textContent = big;
  pad.lastChild.textContent = small;
}

function press() {
  if (state === 'idle' || state === 'result' || state === 'early') {
    if (results.length >= TRIES) { results.length = 0; list.replaceChildren(); analysis.replaceChildren(); }
    state = 'wait';
    set('is-wait', 'חכו...', 'עוד לא! חכו לירוק');
    timer = setTimeout(() => { state = 'go'; t0 = performance.now(); set('is-go', 'עכשיו!', ''); }, 1500 + Math.random() * 2500);
  } else if (state === 'wait') {
    clearTimeout(timer);
    state = 'early';
    set('is-early', 'מוקדם מדי! 🙃', 'המוח ניחש במקום לחכות. לחצו כדי לנסות שוב');
  } else if (state === 'go') {
    const ms = Math.round(performance.now() - t0);
    results.push(ms);
    list.append(h('li', {}, `${ms} אלפיות שנייה`));
    state = 'result';
    set('is-result', `${ms} אלפיות שנייה`, results.length < TRIES ? `ניסיון ${results.length} מתוך ${TRIES}. לחצו להמשך` : 'סיימתם! לחצו כדי להתחיל מחדש');
    if (results.length >= TRIES) analyze();
  }
}
pad.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
pad.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(); } });
pad.addEventListener('click', (e) => e.preventDefault());

function analyze() {
  const sorted = [...results].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const best = sorted[0];
  const nerveMs = Math.round((NERVE_PATH / NERVE_SPEED) * 1000);
  const pct = Math.max(2, Math.round((nerveMs / median) * 100));
  analysis.replaceChildren(
    h('h2', { text: 'מה גיליתם' }),
    h('p', {}, h('strong', { text: `הזמן האופייני שלכם: ${median} אלפיות שנייה` }), ` (הכי מהיר: ${best}). אצל רוב האנשים זה בין 200 ל-300.`),
    h('div', { class: 'reaction-bar', role: 'img', 'aria-label': `מתוך ${median} אלפיות שנייה, רק כ-${nerveMs} הם זמן הנסיעה בעצבים` },
      h('span', { class: 'rb-nerve', style: `width:${pct}%` }), h('span', { class: 'rb-brain' })),
    h('p', { class: 'legend-row' }, h('span', { class: 'lg-na', text: `נסיעה בחוטי העצב: כ-${nerveMs} אלפיות שנייה` }), h('span', { class: 'lg-k', text: 'כל השאר: המוח והסינפסות' })),
    h('p', { text: `האות צריך לעבור כ-${NERVE_PATH} מטר: מהעין למוח, ומהמוח לאצבע. במהירות של כ-${NERVE_SPEED} מטר לשנייה זה לוקח רק כ-${nerveMs} אלפיות שנייה. אז לאן הלך כל השאר?` }),
    h('p', { text: 'רוב הזמן הולך על עיבוד: העין הופכת אור לחשמל, המוח מזהה "ירוק!", מחליט ללחוץ ומתכנן את התנועה. בדרך האות עובר דרך הרבה סינפסות — "תחנות העברה" שבהן הוא מחכה כמה אלפיות שנייה. ובסוף גם השריר צריך זמן להתכווץ.' }),
    h('p', { class: 'muted', text: 'בתיק "הפטיש של הרופאה" תראו רפלקס שלוקח רק 20 אלפיות שנייה — כי הוא לא עובר בכלל דרך המוח.' }),
  );
}

document.getElementById('reaction-lab').append(h('div', { class: 'reaction' }, pad, h('div', { class: 'reaction-side' }, h('p', { class: 'sim-label', text: 'התוצאות שלכם' }), list, analysis)));
