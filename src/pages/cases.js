// רשימת התיקים, עם סינון לפי נושא ורמת קושי
import { h } from '../lib/dom.js';
import { CASES, CATEGORIES, categoryById, caseUrl, DIFFICULTY } from '../data/cases.js';
import { stripScope } from '../components/strip.js';

const root = document.getElementById('cases-root');
const state = { cat: 'all', diff: 'all' };

const chip = (group, value, label) => h('label', { class: 'chip' },
  h('input', { type: 'radio', name: group, value, checked: state[group] === value,
    onchange: () => { state[group] = value; render(); } }),
  label);

const filters = h('div', { class: 'filters' },
  h('fieldset', {}, h('legend', { text: 'נושא' }),
    h('div', { class: 'chip-row' }, chip('cat', 'all', 'הכול'), CATEGORIES.map((c) => chip('cat', c.id, `${c.emoji} ${c.label}`)))),
  h('fieldset', {}, h('legend', { text: 'רמה' }),
    h('div', { class: 'chip-row' }, chip('diff', 'all', 'הכול'), [1, 2, 3].map((d) => chip('diff', String(d), DIFFICULTY[d])))),
);
const count = h('p', { class: 'result-count', role: 'status' });
const grid = h('div', { class: 'grid case-grid' });

const cards = CASES.map((c) => {
  const cat = categoryById(c.category);
  const first = c.strips[0];
  const thumb = h('div', { class: 'card-scope', 'aria-hidden': 'true' });
  const card = h('article', { class: 'card case-card', dataset: { cat: c.category, diff: String(c.difficulty) } },
    thumb,
    h('div', { class: 'card-body' },
      h('div', { class: 'card-meta' },
        h('span', { class: `tag tag-${c.category}`, text: `${cat.emoji} ${cat.label}` }),
        h('span', { class: 'difficulty', 'aria-label': `רמה: ${DIFFICULTY[c.difficulty]}` },
          h('span', { class: 'difficulty-dots', 'aria-hidden': 'true' }, [1, 2, 3].map((i) => h('i', { class: i <= c.difficulty ? 'on' : '' }))),
          DIFFICULTY[c.difficulty])),
      h('h2', {}, h('a', { class: 'card-link', href: caseUrl(c) }, h('span', { class: 'case-emoji', 'aria-hidden': 'true', text: c.emoji }), ' ', c.title)),
      h('p', { text: c.question }),
    ),
  );
  // רצועה קטנה כתמונה מקדימה
  const s = stripScope({ ...first, height: 64, scale: null, tag: null });
  thumb.append(s.el);
  return card;
});
grid.append(...cards);
root.replaceChildren(filters, count, grid);

function render() {
  let n = 0;
  for (const card of cards) {
    const show = (state.cat === 'all' || card.dataset.cat === state.cat) && (state.diff === 'all' || card.dataset.diff === state.diff);
    card.hidden = !show;
    if (show) n++;
  }
  count.textContent = n === CASES.length ? `${n} תיקים` : `${n} מתוך ${CASES.length} תיקים`;
}
render();
