// הגדרות אתר מרוכזות. הקובץ נטען גם ב-Node (vite.config.js) וגם בדפדפן, ולכן אין בו API של דפדפן.

export const SITE = {
  name: 'ניצוץ',                 // TODO: לאשר שם סופי
  tagline: 'החשמל שבתוכנו',
  // כתובת האתר החי (לקישורים מלאים ב-sitemap וב-Open Graph). כשיהיה דומיין — לעדכן כאן ולהוסיף public/CNAME.
  url: 'https://nadaval56.github.io/electro/',
};

// icon: תוכן ה-SVG (viewBox 0 0 36 36). מוצג בתפריט הנפתח בנייד ובקוביות בעמוד הבית.
export const ICONS = {
  cases: '<rect x="4" y="7" width="28" height="22" rx="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 20h5l2-5 3 9 3-13 2 9h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
  physics: '<circle cx="9" cy="18" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M13 18h4" stroke="currentColor" stroke-width="1.5"/><path d="M17 18c3 0 3-7 6-7s3 14 6 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5 9l-1.5-2M9 7V4.5M13 9l1.5-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  lab: '<path d="M14 4h8M15 4v10L6 29a2 2 0 0 0 1.7 3h20.6a2 2 0 0 0 1.7-3L21 14V4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M19 18l-4 6h5l-3 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>',
  nature: '<path d="M4 19c4-6 10-8 16-6 3 1 6 3 9 3-2 2-5 3-9 3-5 0-9 3-16 0z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="23" cy="15.5" r="1.2" fill="currentColor"/><path d="M12 25l-2 4h4l-2 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M30 13l2-3M31 18l3 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  history: '<path d="M9 4h18M9 32h18M11 4c0 8 7 10 7 14s-7 6-7 14M25 4c0 8-7 10-7 14s7 6 7 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13 30c1-3 5-5 5-8 0 3 4 5 5 8z" fill="currentColor" opacity=".6"/>',
  about: '<circle cx="18" cy="18" r="13" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M18 16v9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="18" cy="11.5" r="1.6" fill="currentColor"/>',
};

export const NAV = [
  { href: 'cases.html', label: 'התיקים', pages: ['cases', 'case'], icon: ICONS.cases },
  { href: 'physics.html', label: 'איך זה עובד', pages: ['physics'], icon: ICONS.physics },
  { href: 'lab.html', label: 'המעבדה', pages: ['lab', 'lab-neuron', 'lab-battery', 'lab-race', 'lab-reaction', 'lab-heart', 'lab-pacemaker', 'lab-brainwaves'], icon: ICONS.lab },
  { href: 'nature.html', label: 'חשמל בטבע', pages: ['nature'], icon: ICONS.nature },
  { href: 'history.html', label: 'היסטוריה', pages: ['history'], icon: ICONS.history },
  { href: 'about.html', label: 'אודות', pages: ['about'], icon: ICONS.about },
];

// כלי המעבדה, לפי הסדר — לתפריט המעבדה ולמעבר "הקודם / הבא" בעמודי הכלים
export const LAB = [
  { page: 'lab-battery', label: 'התא כסוללה' },
  { page: 'lab-neuron', label: 'נוירון במעבדה' },
  { page: 'lab-race', label: 'מרוץ האותות' },
  { page: 'lab-reaction', label: 'כמה מהר אתם?' },
  { page: 'lab-heart', label: 'הלב החשמלי' },
  { page: 'lab-pacemaker', label: 'אתם הקוצב!' },
  { page: 'lab-brainwaves', label: 'גלי מוח' },
];

// שורה קצרה בפוטר, שמקשרת להבהרה המלאה בעמוד אודות (about.html#medical).
export const DISCLAIMER = 'ללימוד בלבד, לא לאבחון רפואי';

// פס "עוד אתרים שלי" בתחתית כל עמוד — אותו פס כמו בשאר האתרים (הועתק מאתר הרנטגן).
// קישורים בלבד: שום דבר לא נטען מהאתרים האלה. [אימוג'י, כתובת, טקסט הקישור, המשך שאינו קישור]
export const SISTER_INVITE = 'https://chat.whatsapp.com/JPkp1hyk4J938apVTFu6J1';
export const SISTER_SITES = [
  ['🔭', SISTER_INVITE, 'קבוצת ווטסאפ · עדכוני אסטרונומיה יומיים (קבוצה שקטה)', ''],
  ['🩻', 'https://roentgen.co.il/', 'רנטגן · לראות מבפנים', ''],
  ['🧠', 'https://cranialnerves.co.il/', 'עצבי הגולגולת · 12 זוגות העצבים', ''],
  ['☀️', 'https://sunspots.co.il/', 'השמש היום · כתמי שמש בזמן אמת', ''],
  ['📜', 'https://geniza.co.il/', 'הגניזה הקהירית', ''],
  ['🛠️', 'https://making-il.co.il/', 'מייקינג', ' · יצירה טכנולוגית'],
  ['💶', 'https://banknote.co.il/', 'Banknote · שטרות ומטבעות', ''],
  ['🛩️', 'https://dronexam.co.il/', 'לעוף לשמיים · מבחן רת"א לרחפנים', ''],
  ['🌱', 'https://holisticcenter.co.il/', 'מעט צרי · רפואה משלימה', ''],
  ['🛸', 'https://pursue.co.il/', 'PURSUE · ארכיון עב"מים', ''],
  ['🌍', 'https://quake.co.il/', 'רעידת אדמה · רעידות היסטוריות', ''],
  ['📅', 'https://heb-cal.co.il/', 'לוח עברי', ''],
  ['📖', 'https://kal-vachomer.co.il/', 'סגולת הבן איש חי לרפואה', ''],
];
