import { initLessonNav } from '../lib/lesson-nav.js';
import { mediaFigure } from '../data/media.js';

// תמונות מ-content/media.json: <figure data-media="id">
for (const fig of document.querySelectorAll('figure[data-media]')) fig.replaceWith(mediaFigure(fig.dataset.media, fig.className));

initLessonNav(document.querySelector('.lesson-nav'));
