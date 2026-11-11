// ציר זמן: סרגל שנים דביק לקפיצה מהירה, ורשימת אירועים. כל אירוע עם מקור.
// מסמן בסרגל את האירוע שנמצא כרגע בתצוגה (IntersectionObserver).
import { h } from '../lib/dom.js';

const imgUrl = (file) => `${import.meta.env.BASE_URL}images/${file}`;

/** @param {{events: Array<{id,year,date,title,text,source:{label,url},link?:{label,href}}>}} opts */
export function createTimeline({ events }) {
  const nav = h('nav', { class: 'tl-nav', 'aria-label': 'קפיצה לשנה' },
    h('ol', {}, events.map((e) => h('li', {},
      h('a', { href: `#tl-${e.id}`, 'data-id': e.id, text: e.year })))),
  );

  const list = h('ol', { class: 'tl-list' }, events.map((e) => h('li', { class: 'tl-item', id: `tl-${e.id}` },
    h('div', { class: 'tl-marker', 'aria-hidden': 'true' }, h('span', { text: e.year })),
    h('article', { class: 'tl-card' },
      e.image && h('figure', { class: 'tl-figure' },
        h('img', { src: imgUrl(e.image.file), alt: e.image.alt, loading: 'lazy', decoding: 'async' }),
        h('figcaption', {}, e.image.caption, ' ',
          // הדפסה מנגטיב: העצמות כהות — מפנה להסבר, כדי שלא ייראה כסתירה ל"עצם לבנה"
          e.image.oldPrint && h('span', {}, 'זו הדפסה על נייר מהנגטיב, ולכן העצמות כהות (',
            h('a', { href: './physics.html#old-prints', text: 'למה?' }), '). '),
          h('a', { href: e.image.source.url, rel: 'noopener', target: '_blank', text: 'מקור התמונה' })),
      ),
      h('p', { class: 'tl-date', text: e.date }),
      h('h2', { class: 'tl-title', text: e.title }),
      h('p', { class: 'tl-text', text: e.text }),
      h('p', { class: 'tl-meta' },
        h('a', { href: e.source.url, rel: 'noopener', target: '_blank' }, 'מקור: ', e.source.label),
        ...(e.moreSources ?? []).map((m) => h('a', { href: m.url, rel: 'noopener', target: '_blank', text: m.label })),
        e.link && (/^https?:/.test(e.link.href)
          ? h('a', { class: 'tl-case', href: e.link.href, rel: 'noopener', target: '_blank', text: e.link.label })
          : h('a', { class: 'tl-case', href: `./${e.link.href}`, text: e.link.label })),
      ),
    ),
  )));

  const el = h('div', { class: 'timeline' }, nav, list);

  if ('IntersectionObserver' in window) {
    const links = new Map([...nav.querySelectorAll('a')].map((a) => [a.dataset.id, a]));
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const id = en.target.id.slice(3);
        links.forEach((a, key) => a.toggleAttribute('aria-current', key === id));
        links.get(id)?.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    list.querySelectorAll('.tl-item').forEach((li) => io.observe(li));
  }
  return { el };
}
