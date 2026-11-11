import { h } from '../lib/dom.js';
import { MEDIA, mediaUrl, LICENSE_LABEL } from '../data/media.js';

document.getElementById('image-credits').append(...Object.values(MEDIA).map((m) => h('li', {},
  h('img', { src: mediaUrl(m.file), alt: '', loading: 'lazy' }),
  h('span', {}, h('a', { href: m.source.url, rel: 'noopener', target: '_blank', text: m.source.title }), ` — ${m.source.creator}. ${LICENSE_LABEL[m.source.license]}.`))));
