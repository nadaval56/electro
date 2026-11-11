// תמונות מ-content/media.json (כולן נחלת הכלל או CC-BY; נבדק ב-scripts/validate-cases.mjs)
import media from '../../content/media.json';
import { h } from '../lib/dom.js';

export const MEDIA = media;
export const mediaUrl = (file) => `${import.meta.env.BASE_URL}images/${file}`;
export const LICENSE_LABEL = { 'Public-Domain': 'נחלת הכלל', 'CC-BY-4.0': 'CC BY 4.0' };

// <figure> עם תמונה, כיתוב וקרדיט קצר
export function mediaFigure(id, cls = 'media-figure') {
  const m = MEDIA[id];
  if (!m) return null;
  return h('figure', { class: cls },
    h('img', { src: mediaUrl(m.file), alt: m.alt, loading: 'lazy', decoding: 'async' }),
    h('figcaption', {}, m.caption, ' ',
      h('span', { class: 'credit' }, h('a', { href: m.source.url, rel: 'noopener', target: '_blank', text: m.source.creator }), ` · ${LICENSE_LABEL[m.source.license]}`)));
}
