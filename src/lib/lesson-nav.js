// תפריט פרקים (.lesson-nav): מסמן את הפרק שבמסך, ובנייד גולל את פס השבבים אליו.
// משמש בעמודים "איך זה עובד" ו"אודות".
export function initLessonNav(nav) {
  if (!nav) return;
  const links = new Map([...nav.querySelectorAll('a')].map((a) => [a.hash.slice(1), a]));
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id);
    const current = [...links.keys()].find((id) => visible.has(id));
    if (!current) return;
    for (const [id, a] of links) {
      if (id === current) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
    const a = links.get(current);
    if (nav.scrollWidth > nav.clientWidth) {
      const r = a.getBoundingClientRect();
      const n = nav.getBoundingClientRect();
      if (r.left < n.left || r.right > n.right) nav.scrollBy({ left: r.left - n.left - (n.width - r.width) / 2 });
    }
  }, { rootMargin: '-35% 0px -55% 0px' });
  for (const id of links.keys()) {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  }
}
