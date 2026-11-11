# ניצוץ — החשמל שבתוכנו

אתר לימודי סטטי בעברית על אלקטרופיזיולוגיה — החשמל בגוף: תאים, עצבים, שרירים, הלב והמוח. מתאים לילדים ולמבוגרים סקרנים. נבנה בהשראת אתר הרנטגן (nadaval56/X-Ray): אותו מבנה, אותה מערכת עיצוב, תפריט הנגישות ופקדי הפרטיות.

## הרצה

```bash
npm install
npm run dev        # שרת פיתוח
npm run build      # בדיקת תיקים + build ל-dist/
npm run preview    # הצגת ה-build
```

## מבנה

```
*.html                    עמודים: index, cases, case, physics, nature, history, about, lab, lab-*
src/config.js             שם האתר, ניווט, רשימת כלי המעבדה, פס "עוד אתרים שלי"
src/partials/             head, כותרת ופוטר משותפים (מוזרקים ב-vite.config.js)
src/lib/signals.js        מחוללי אותות: אק"ג, EEG, EMG, קוצים, דג חשמלי
src/lib/live-ecg.js       אק"ג חי עם קצב משתנה / פעימות ידניות
src/components/scope.js   אוסצילוסקופ: רצועה סטטית (עם סימון) ומוניטור חי
src/pages/                קוד לכל עמוד (כולל כל כלי המעבדה)
content/cases/*.json      התיקים, אחד לכל קובץ
content/nature.json       חיות וצמחים חשמליים
content/timeline.json     ציר הזמן, עם מקור לכל אירוע
content/sources.md        מקורות לכל מספר וטענה
```

## הוספת תיק

1. יוצרים `content/cases/<id>.json` (שם הקובץ = `id`). העתיקו תיק קיים כתבנית.
2. `strips[].signal` מתאר את האות: `ecg` (bpm, breath…), `eeg` (segments עם mix של delta/theta/alpha/beta), `emg` (segments עם level), `spikes`, `eel`, או `sum` של כמה.
3. `task.type`: `choice` (אפשרויות, בדיוק אחת נכונה) או `mark` (סימון על רצועה: `target: [from, to]` בשניות, או `feature: "R"` לאק"ג).
4. `npm run validate`.

התיק מופיע ברשימה ובעמוד משלו (`case-<id>.html`) בלי לגעת בקוד.

## פריסה

GitHub Pages דרך `.github/workflows/pages.yml` (בכל push ל-main). צריך להפעיל ב-Settings → Pages את המקור "GitHub Actions". כשיהיה דומיין — לעדכן את `SITE.url` ב-`src/config.js` ולהוסיף `public/CNAME`.
