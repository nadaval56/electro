// עזר קטן ליצירת אלמנטים, כדי לא להרכיב HTML ממחרוזות (ולא להסתכן בהזרקה מתוכן).
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === false || value == null) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value == null) continue;
    if (key === 'class') el.setAttribute('class', value);
    else el.setAttribute(key, value);
  }
  for (const child of children.flat()) if (child) el.append(child);
  return el;
}

export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// מחכה לטעינת תמונה ומחזיר את יחס הגובה/רוחב שלה
export function imageAspect(img) {
  const done = () => (img.naturalWidth ? img.naturalHeight / img.naturalWidth : 1);
  if (img.complete && img.naturalWidth) return Promise.resolve(done());
  return new Promise((res) => {
    img.addEventListener('load', () => res(done()), { once: true });
    img.addEventListener('error', () => res(1), { once: true });
  });
}
