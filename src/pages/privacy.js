// פקדי "הנתונים שלך" בדף מדיניות הפרטיות: עיון, מחיקה וויתור על שמירה מקומית.
// נשען על PRIVACY הגלובלי מ-public/a11y/privacy.js (נטען ב-head לפני הקובץ הזה).

const P = window.PRIVACY;
const status = document.getElementById('privacy-status');
const dump = document.getElementById('privacy-dump');
const showBtn = document.getElementById('privacy-show');
const clearBtn = document.getElementById('privacy-clear');
const toggleBtn = document.getElementById('privacy-toggle');

function refresh() {
  if (!P) { status.textContent = 'לא ניתן לגשת לאחסון המקומי בדפדפן הזה.'; return; }
  const rows = P.inventory();
  const allowed = P.storageAllowed();
  status.textContent = (rows.length
    ? `שמורים במכשיר הזה ${rows.length === 1 ? 'מפתח אחד' : `${rows.length} מפתחות`} של האתר.`
    : 'לא שמור במכשיר הזה שום דבר של האתר.')
    + (allowed ? '' : ' בחרת בלי שמירה מקומית — העדפות הנגישות לא יישמרו.');
  toggleBtn.textContent = allowed ? 'בלי שמירה מקומית' : 'לאפשר שמירה מקומית';
  toggleBtn.setAttribute('aria-pressed', String(!allowed));
  if (!dump.hidden) show();
}

function show() {
  const rows = P.inventory();
  dump.hidden = false;
  dump.textContent = rows.length
    ? rows.map((r) => `${r.key}\n${r.value}`).join('\n\n')
    : 'אין כלום.';
}

if (P) {
  showBtn.addEventListener('click', () => { dump.hidden ? show() : (dump.hidden = true); });
  clearBtn.addEventListener('click', () => {
    P.purge();
    P.remove(P.KEY);
    window.A11Y?.reset();
    P.purge(); // reset של תפריט הנגישות כותב שוב — מוחקים אחריו
    refresh();
    status.textContent = 'נמחק. במכשיר הזה לא נשאר שום דבר של האתר.';
  });
  toggleBtn.addEventListener('click', () => {
    P.decide(!P.storageAllowed());
    refresh();
  });
}
refresh();
