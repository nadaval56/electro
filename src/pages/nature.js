import { h } from '../lib/dom.js';
import data from '../../content/nature.json';
import { createQuiz } from '../components/quiz.js';
import { mediaFigure } from '../data/media.js';

const caseLink = (href) => (import.meta.env.DEV ? `./case.html?id=${href.replace(/^case-|\.html$/g, '')}` : `./${href}`);
const wow = (t) => h('p', { class: 'nature-wow' }, h('strong', { text: 'וואו! ' }), t);

// סרגל וולטים לוגריתמי: 0.1 עד 1000 וולט
const voltBar = (v) => h('div', { class: 'volt' },
  h('div', { class: 'volt-track', role: 'img', 'aria-label': `כ-${v} וולט` },
    h('span', { class: 'volt-fill', style: `width:${Math.max(4, ((Math.log10(v) + 1) / 4) * 100)}%` }),
    h('span', { class: 'volt-mark', style: 'inset-inline-start:84%', title: 'השקע בבית: 230 וולט' })),
  h('div', { class: 'volt-scale', 'aria-hidden': 'true' }, ['0.1', '1', '10', '100', '1000'].map((x) => h('span', { text: x }))));

document.getElementById('makers').append(...data.makers.map((a) => h('article', { class: 'nature-card', id: a.id },
  a.media && mediaFigure(a.media, 'nature-figure'),
  h('div', { class: 'nature-head' }, h('span', { class: 'nature-emoji', 'aria-hidden': 'true', text: a.emoji }),
    h('div', {}, h('h3', { text: a.name }), h('p', { class: 'muted small', text: `📍 ${a.where}` }))),
  h('p', { class: 'nature-power' }, '🔋 ', a.power),
  voltBar(a.volts),
  h('p', { text: a.text }), wow(a.wow))));

document.getElementById('sensers').append(...data.sensers.map((a) => h('article', { class: 'nature-card', id: a.id },
  a.media && mediaFigure(a.media, 'nature-figure'),
  h('div', { class: 'nature-head' }, h('span', { class: 'nature-emoji', 'aria-hidden': 'true', text: a.emoji }),
    h('div', {}, h('h3', { text: a.name }), h('p', { class: 'muted small', text: `📡 ${a.sense}` }))),
  h('p', { text: a.text }), wow(a.wow))));

document.getElementById('plants-list').append(...data.plants.map((a) => h('article', { class: 'nature-card' },
  h('div', { class: 'nature-head' }, h('span', { class: 'nature-emoji', 'aria-hidden': 'true', text: a.emoji }), h('h3', { text: a.name })),
  h('p', { text: a.text }),
  a.link && h('p', {}, h('a', { class: 'lab-link', href: caseLink(a.link), text: 'לתיק: הצמח שסופר עד שתיים' })))));

const QUIZ = [
  { question: 'איזו חיה מוצאת אוכל כשהעיניים, האוזניים והאף שלה סגורים?', options: [
    { text: 'ברווזן', correct: true, feedback: 'המקור שלו מרגיש את החשמל של שרירי הטרף.' },
    { text: 'דבורת בומבוס', feedback: 'דבורות מרגישות חשמל, אבל מחפשות פרחים בעיניים פקוחות.' },
    { text: 'צלופח חשמלי', feedback: 'הצלופח אכן "רואה" בחשמל, אבל הוא לא סוגר את העיניים והאוזניים.' }] },
  { question: 'למה הצלופח החשמלי מגיע למאות וולט, כשתא אחד נותן פחות מוולט?', options: [
    { text: 'אלפי תאים מסודרים בטור, כמו סוללות בפנס', correct: true, feedback: 'כשסוללות מחוברות בטור, המתחים שלהן מתחברים.' },
    { text: 'הוא אוכל דגים חשמליים אחרים', feedback: 'החשמל נוצר בגוף שלו, לא מגיע מהאוכל.' },
    { text: 'מי הנהר מוליכים חשמל', feedback: 'המים מעבירים את המכה, אבל לא יוצרים אותה.' }] },
  { question: 'מה גורם לדיונאה לסגור את המלכודת?', options: [
    { text: 'שני קוצים חשמליים בתוך זמן קצר', correct: true, feedback: 'נגיעה אחת היא אולי טיפת גשם. שתיים — כנראה חרק.' },
    { text: 'ריח של חרק', feedback: 'הריח מושך את החרק, אבל הסגירה מופעלת בחשמל.' },
    { text: 'אור השמש', feedback: 'המלכודת נסגרת גם בחושך — מה שקובע הוא הנגיעות.' }] },
];
document.getElementById('nature-quiz').append(...QUIZ.map((q, i) => createQuiz({ ...q, id: `nq${i}` }).el));
