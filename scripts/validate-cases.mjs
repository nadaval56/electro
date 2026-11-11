// בדיקת התיקים לפני build: שדות חובה, טקסט חלופי לכל רצועה, תשובה נכונה אחת, קישורים לעמודים קיימים.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dir = resolve(root, 'content/cases');
const cats = JSON.parse(readFileSync(resolve(root, 'content/categories.json'), 'utf8')).map((c) => c.id);
const TYPES = ['ecg', 'eeg', 'emg', 'spikes', 'eel', 'sum'];
const errors = [];

const linkOk = (href) => existsSync(resolve(root, href.split('#')[0]));

for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const err = (m) => errors.push(`${f}: ${m}`);
  let c;
  try { c = JSON.parse(readFileSync(resolve(dir, f), 'utf8')); } catch (e) { err(`JSON שבור: ${e.message}`); continue; }
  if (c.id !== basename(f, '.json')) err('id לא תואם לשם הקובץ');
  for (const k of ['title', 'story', 'question', 'outcome', 'emoji']) if (!c[k]) err(`חסר ${k}`);
  if (!cats.includes(c.category)) err(`קטגוריה לא מוכרת: ${c.category}`);
  if (![1, 2, 3].includes(c.difficulty)) err('difficulty חייב להיות 1–3');
  const ids = new Set();
  for (const s of c.strips ?? []) {
    ids.add(s.id);
    if (!s.alt) err(`לרצועה ${s.id} חסר alt`);
    if (!(s.duration > 0)) err(`לרצועה ${s.id} חסר duration`);
    if (!(s.yMax > s.yMin)) err(`לרצועה ${s.id} טווח y לא תקין`);
    if (!TYPES.includes(s.signal?.type)) err(`לרצועה ${s.id} סוג אות לא מוכר`);
  }
  if (!ids.size) err('אין רצועות');
  const t = c.task ?? {};
  if (t.type === 'choice') {
    if ((t.options ?? []).filter((o) => o.correct).length !== 1) err('צריכה להיות בדיוק תשובה נכונה אחת');
  } else if (t.type === 'mark') {
    if (!ids.has(t.strip)) err('task.strip לא קיים');
    if (!t.hint) err('חסר task.hint');
    if (!t.feature && !(Array.isArray(t.target) && t.target[1] > t.target[0])) err('חסר task.target או task.feature');
  } else err('task.type חייב להיות choice או mark');
  if (!c.reveal?.text) err('חסר reveal.text');
  for (const hl of [c.reveal?.highlight, c.reveal?.highlight2].filter(Boolean)) if (!ids.has(hl.strip)) err('highlight על רצועה לא קיימת');
  if (!c.why?.text) err('חסר why.text');
  for (const l of [c.why?.link, c.lab].filter(Boolean)) if (!linkOk(l.href)) err(`קישור לעמוד שלא קיים: ${l.href}`);
}

// תמונות: רישיון מותר בלבד, קובץ קיים, טקסט חלופי
const LICENSES = ['Public-Domain', 'CC0-1.0', 'CC-BY-4.0', 'CC-BY-3.0', 'CC-BY-2.0'];
const media = JSON.parse(readFileSync(resolve(root, 'content/media.json'), 'utf8'));
for (const [id, m] of Object.entries(media)) {
  if (!LICENSES.includes(m.source?.license)) errors.push(`media ${id}: רישיון לא מותר (${m.source?.license})`);
  if (!m.alt || !m.caption || !m.source?.url || !m.source?.creator) errors.push(`media ${id}: חסר alt/caption/קרדיט`);
  if (!existsSync(resolve(root, 'public/images', m.file))) errors.push(`media ${id}: הקובץ ${m.file} חסר`);
}
const usedMedia = [
  ...JSON.parse(readFileSync(resolve(root, 'content/timeline.json'), 'utf8')).events.map((e) => e.media),
  ...Object.values(JSON.parse(readFileSync(resolve(root, 'content/nature.json'), 'utf8'))).flat().map((a) => a.media),
].filter(Boolean);
for (const id of usedMedia) if (!media[id]) errors.push(`תמונה לא מוכרת: ${id}`);

if (errors.length) {
  console.error(`✗ ${errors.length} בעיות בתיקים:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('✓ כל התיקים והתמונות תקינים');
