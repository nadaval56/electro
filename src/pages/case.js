// עמוד תיק: סיפור → משימה (סימון על הרצועה או בחירה) → חשיפה → למה זה ככה → מה קרה בסוף
import { h } from '../lib/dom.js';
import { CASES, caseById, categoryById, caseUrl, DIFFICULTY } from '../data/cases.js';
import { stripScope } from '../components/strip.js';
import { createQuiz } from '../components/quiz.js';
import { ecgFeatures } from '../lib/signals.js';
import { COLORS } from '../components/scope.js';

const root = document.getElementById('case-root');
const id = document.documentElement.dataset.caseId || new URLSearchParams(location.search).get('id')
  || location.pathname.match(/case-([\w-]+)\.html/)?.[1];
const c = caseById(id);

if (!c) {
  root.replaceChildren(h('div', { class: 'page-head' },
    h('h1', { text: 'התיק לא נמצא' }),
    h('p', {}, 'אולי הקישור שגוי. ', h('a', { href: './cases.html', text: 'לכל התיקים' }))));
} else {
  render(c);
}

function step(num, label, title, ...body) {
  return h('section', { class: 'step' },
    h('p', { class: 'step-label' }, h('span', { class: 'num', text: num }), label),
    title && h('h2', { text: title }),
    ...body);
}

function render(c) {
  document.title = `${c.title} · ${document.title.split(' · ').pop()}`;
  const cat = categoryById(c.category);

  const scopes = new Map();
  const media = h('div', { class: 'case-media' });
  for (const strip of c.strips) {
    const isTarget = c.task.type === 'mark' && c.task.strip === strip.id;
    const sc = stripScope(strip, isTarget ? { onMark: (t) => onMark(t) } : {});
    scopes.set(strip.id, sc);
    media.append(h('figure', { class: 'strip-figure' }, sc.el));
  }
  media.append(h('p', { class: 'strip-note muted' }, 'הרצועות באתר הן הדמיה שנבנתה לפי ערכים אמיתיים, ולא הקלטה של אדם או חיה מסוימים. ',
    h('a', { href: './about.html#signals', text: 'עוד על זה' })));

  // ---------- משימה ----------
  const feedback = h('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
  const showAnswer = h('button', { type: 'button', class: 'btn btn-ghost', hidden: true, text: 'הצגת התשובה' });
  let misses = 0, done = false;
  let task;
  if (c.task.type === 'choice') {
    task = createQuiz({ id: `q-${c.id}`, question: c.question, options: c.task.options, onDone: () => finish() }).el;
  } else {
    task = h('div', {},
      h('p', { class: 'task-q', text: c.question }),
      h('p', { class: 'hotspot-hint muted' }, 'לחצו על הרצועה במקום שבחרתם. במקלדת: חיצים להזזה, Enter לסימון.'),
      feedback,
      h('div', { class: 'btn-row' }, showAnswer));
  }

  const targetHit = (t) => {
    if (c.task.feature) {
      const strip = c.strips.find((s) => s.id === c.task.strip);
      return ecgFeatures(strip.signal)[c.task.feature].some((f) => Math.abs(f - t) <= c.task.tol);
    }
    const [a, b] = c.task.target;
    return t >= a && t <= b;
  };

  function onMark(t) {
    if (done) return;
    if (targetHit(t)) {
      feedback.className = 'feedback is-hit';
      feedback.textContent = 'בול! זה בדיוק המקום.';
      scopes.get(c.task.strip).setMarker(t, COLORS.hit);
      finish();
      return;
    }
    misses++;
    feedback.className = 'feedback is-miss';
    feedback.textContent = misses === 1 ? `עוד לא. רמז: ${c.task.hint}` : 'לא בדיוק. אפשר לנסות שוב, או להציג את התשובה.';
    if (misses >= 2) showAnswer.hidden = false;
  }
  showAnswer.addEventListener('click', () => {
    feedback.className = 'feedback is-near';
    feedback.textContent = 'הנה התשובה, מסומנת על הרצועה.';
    finish();
  });

  // ---------- חשיפה ----------
  const reveal = step(3, 'מה רואים', 'הגילוי', h('p', { text: c.reveal.text }));
  const why = step(4, 'למה זה נראה ככה?', c.why.title, h('p', { text: c.why.text }),
    c.why.link && h('p', {}, h('a', { class: 'lab-link', href: `./${c.why.link.href}` }, `להסבר המלא: ${c.why.link.label}`)));
  const end = step(5, 'מה קרה בסוף', null, h('p', { text: c.outcome }),
    c.kids && h('aside', { class: 'kids-box' }, h('strong', { text: 'בשפה פשוטה' }), h('p', { text: c.kids })),
    c.lab && h('p', {}, h('a', { class: 'btn', href: `./${c.lab.href}`, text: `🧪 ${c.lab.label}` })),
    nextCase(c));
  for (const s of [reveal, why, end]) s.hidden = true;

  function finish() {
    if (done) return;
    done = true;
    showAnswer.hidden = true;
    for (const sc of scopes.values()) sc.lock?.();
    const r = c.reveal;
    for (const hl of [r.highlight, r.highlight2].filter(Boolean)) scopes.get(hl.strip).highlight(hl);
    if (r.features) {
      const strip = c.strips.find((s) => s.id === c.task.strip);
      const f = ecgFeatures(strip.signal);
      const i = f.R.findIndex((x) => x > 0.6);
      const sc = scopes.get(strip.id);
      sc.highlight({ from: f.P[i] - 0.05, to: f.P[i] + 0.05, label: 'P', labelBottom: true, fill: 'rgba(185,163,255,.16)', stroke: COLORS.brain });
      sc.highlight({ from: f.R[i] - 0.05, to: f.R[i] + 0.05, label: 'QRS', fill: 'rgba(255,112,136,.16)', stroke: COLORS.heart });
      sc.highlight({ from: f.T[i] - 0.09, to: f.T[i] + 0.09, label: 'T', fill: 'rgba(255,209,102,.14)', stroke: COLORS.spark });
    }
    for (const s of [reveal, why, end]) { s.hidden = false; s.classList.add('is-entering'); }
    reveal.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }

  const head = h('header', { class: 'case-head' },
    h('p', { class: 'breadcrumb' }, h('a', { href: './cases.html', text: 'התיקים' }), ' / ', cat.label),
    h('div', { class: 'case-tags' },
      h('span', { class: `tag tag-${c.category}`, text: `${cat.emoji} ${cat.label}` }),
      h('span', { class: 'tag', text: `רמה: ${DIFFICULTY[c.difficulty]}` })),
    h('h1', {}, h('span', { 'aria-hidden': 'true', text: `${c.emoji} ` }), c.title),
  );

  const steps = h('div', { class: 'case-steps' },
    step(1, 'הסיפור', null, h('p', { class: 'story', text: c.story })),
    step(2, 'מה אתם חושבים?', null, task),
    reveal, why, end);

  root.replaceChildren(h('div', { class: 'case-layout' }, head, media, steps));
}

function nextCase(c) {
  const i = CASES.indexOf(c);
  const next = CASES[(i + 1) % CASES.length];
  return h('nav', { class: 'pager', 'aria-label': 'מעבר בין תיקים' },
    h('a', { class: 'pager-link pager-all', href: './cases.html' }, h('span', { class: 'pager-dir', text: 'חזרה' }), h('span', { class: 'pager-title', text: 'כל התיקים' })),
    h('a', { class: 'pager-link pager-next', href: caseUrl(next) }, h('span', { class: 'pager-dir', text: 'התיק הבא' }), h('span', { class: 'pager-title', text: `${next.emoji} ${next.title}` })));
}
