// נטען בכל עמוד: סגנונות, ותפריט נייד.
// גופן Heebo מוגש מהאתר עצמו (לא מ-Google Fonts), כדי שאף צד שלישי לא יראה את הגולשים
import '@fontsource-variable/heebo';
import './styles/main.css';

document.documentElement.classList.add('js');

const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');

if (toggle && nav) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });
}

// תפריט משני שנגלל לרוחב (בנייד): לגלול אליו כך שהפריט הנוכחי ייראה
for (const sub of document.querySelectorAll('.subnav')) {
  const cur = sub.querySelector('[aria-current="page"]');
  if (!cur || sub.scrollWidth <= sub.clientWidth) continue;
  const r = cur.getBoundingClientRect();
  const n = sub.getBoundingClientRect();
  if (r.left < n.left || r.right > n.right) sub.scrollBy({ left: r.left - n.left - (n.width - r.width) / 2 });
}
