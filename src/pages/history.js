import timeline from '../../content/timeline.json';
import { createTimeline } from '../components/timeline.js';

// replaceChildren: ב-HTML יש גרסה סטטית של ציר הזמן (נוצרת ב-build), וה-JS מחליף אותה
document.getElementById('timeline-root').replaceChildren(createTimeline(timeline).el);
