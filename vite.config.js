import { defineConfig } from 'vite';
import { resolve, basename } from 'node:path';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { SITE, NAV, LAB, DISCLAIMER, SISTER_SITES, SISTER_INVITE } from './src/config.js';

const PAGES = [
  'index', 'cases', 'case', 'physics', 'nature', 'history', 'about',
  'lab', ...LAB.map((t) => t.page), 'privacy', 'accessibility', '404',
];

const ROOT = import.meta.dirname;
const CASES = readdirSync(resolve(ROOT, 'content/cases'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(resolve(ROOT, 'content/cases', f), 'utf8')));

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const pageUrl = (page) => `${SITE.url}${page === 'index' ? '' : `${page}.html`}`;
const partial = (name) => readFileSync(resolve(ROOT, 'src/partials', `${name}.html`), 'utf8');

// תגיות שיתוף ו-canonical לעמוד
function metaTags({ page, title, description }) {
  const img = existsSync(resolve(ROOT, `public/og/${page}.jpg`)) ? `${SITE.url}og/${page}.jpg` : `${SITE.url}og/index.jpg`;
  return [
    '<!--og-->',
    page === '404' ? '' : `<link rel="canonical" href="${pageUrl(page)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="he_IL" />`,
    `<meta property="og:site_name" content="${attr(SITE.name)}" />`,
    `<meta property="og:title" content="${attr(title)}" />`,
    `<meta property="og:description" content="${attr(description)}" />`,
    `<meta property="og:url" content="${pageUrl(page)}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    '<!--/og-->',
  ].filter(Boolean).join('\n    ');
}

// מחליף <!-- @header --> / <!-- @footer --> וכו' בכל עמוד ב-partial המשותף
function layoutPartials() {
  return {
    name: 'layout-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const page = basename(ctx.filename, '.html');
        const navItems = NAV.map((item) => {
          const current = item.pages.includes(page) ? ' aria-current="page"' : '';
          const icon = `<svg class="nav-icon" viewBox="0 0 36 36" aria-hidden="true" focusable="false">${item.icon}</svg>`;
          return `<li><a href="./${item.href}"${current}>${icon}<span>${item.label}</span></a></li>`;
        }).join('\n          ');

        const title = html.match(/<title>(.*?)<\/title>/)?.[1]?.replaceAll('{{SITE_NAME}}', SITE.name) ?? SITE.name;
        const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
        const og = metaTags({ page, title, description });
        const isTool = LAB.some((t) => t.page === page);
        return html
          .replace('<header class="page-head">', isTool ? '<header class="page-head">\n          <span class="eyebrow">המעבדה</span>' : '<header class="page-head">')
          .replace('<!-- @labnav -->', labNav(page))
          .replace('<!-- @labpager -->', labPager(page))
          .replace('<!-- @head -->', `${partial('head')}\n    ${og}`)
          .replace('<!-- @header -->', partial('header').replace('{{NAV}}', navItems))
          .replace('<!-- @footer -->', partial('footer').replace('{{DISCLAIMER}}', DISCLAIMER).replace('{{SISTER}}', sisterNav()))
          .replaceAll('{{SITE_NAME}}', SITE.name)
          .replaceAll('{{SITE_TAGLINE}}', SITE.tagline);
      },
    },
  };
}

// פס "עוד אתרים שלי" (public/sister.js מזיז אותו). העותק השני מוסתר מקורא מסך ומהמקלדת.
function sisterNav() {
  const items = (clone) => SISTER_SITES.map(([emoji, url, text, tail]) => {
    const tab = clone ? ' tabindex="-1"' : '';
    const icon = `<span aria-hidden="true">${emoji}</span>`;
    if (tail) return `<span class="sister-item">${icon} <a href="${url}" rel="noopener"${tab}>${attr(text)}</a>${attr(tail)}</span>`;
    const cls = url === SISTER_INVITE ? ' class="sister-invite"' : '';
    return `<a href="${url}" rel="noopener"${cls}${tab}>${icon} ${attr(text)}</a>`;
  }).join('');
  return `<nav class="sister" aria-label="האתרים הנוספים שלי"><span class="sister-lbl">עוד אתרים שלי</span>`
    + `<div class="sister-view"><div class="sister-track"><div class="sister-set">${items(false)}</div>`
    + `<div class="sister-set sister-clone" aria-hidden="true">${items(true)}</div></div></div></nav>`
    + `<script src="./sister.js" defer vite-ignore></script>`;
}

function labNav(page) {
  const items = LAB.map(({ page: p, label }) =>
    `<li><a href="./${p}.html"${p === page ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  return `<nav class="subnav" aria-label="כלי המעבדה"><ul><li><a href="./lab.html">כל המעבדה</a></li>${items}</ul></nav>`;
}

function labPager(page) {
  const i = LAB.findIndex((t) => t.page === page);
  if (i < 0) return '';
  const prev = LAB[i - 1], next = LAB[i + 1];
  const link = (t, dir) => (t
    ? `<a class="pager-link pager-${dir}" href="./${t.page}.html"><span class="pager-dir">${dir === 'prev' ? 'הכלי הקודם' : 'הכלי הבא'}</span><span class="pager-title">${t.label}</span></a>`
    : '<span></span>');
  return `<nav class="pager" aria-label="מעבר בין כלי המעבדה">${link(prev, 'prev')}${link(next, 'next')}</nav>`;
}

// עמוד סטטי לכל תיק (case-<id>.html) עם כותרת ותיאור משלו, ו-sitemap.xml + robots.txt
function seoFiles() {
  return {
    name: 'seo-files',
    enforce: 'post',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const m = req.url?.match(/^\/case-([\w-]+)\.html(\?.*)?$/);
        if (m) req.url = `/case.html?id=${m[1]}`;
        next();
      });
    },
    generateBundle(_, bundle) {
      const base = bundle['case.html'];
      for (const c of CASES) {
        const title = `${c.title} · ${SITE.name}`;
        const description = `${c.question} ${c.story}`.slice(0, 158);
        const html = String(base.source)
          .replace('<html lang="he" dir="rtl">', `<html lang="he" dir="rtl" data-case-id="${attr(c.id)}">`)
          .replace(/<title>.*?<\/title>/, `<title>${attr(title)}</title>`)
          .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${attr(description)}"`)
          .replace(/<!--og-->[\s\S]*?<!--\/og-->/, metaTags({ page: `case-${c.id}`, title, description }));
        this.emitFile({ type: 'asset', fileName: `case-${c.id}.html`, source: html });
      }
      const urls = [
        ...PAGES.filter((p) => p !== 'case' && p !== '404').map((p) => (p === 'index' ? '' : `${p}.html`)),
        ...CASES.map((c) => `case-${c.id}.html`),
      ].map((u) => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n');
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nSitemap: ${SITE.url}sitemap.xml\n` });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [layoutPartials(), seoFiles()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(PAGES.map((p) => [p, resolve(ROOT, `${p}.html`)])),
    },
  },
});
