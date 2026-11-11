// טעינת התיקים מ-content/cases/*.json (בזמן build, דרך Vite)
import categories from '../../content/categories.json';

const modules = import.meta.glob('../../content/cases/*.json', { eager: true, import: 'default' });

export const CASES = Object.values(modules)
  .sort((a, b) => a.difficulty - b.difficulty || categories.findIndex((c) => c.id === a.category) - categories.findIndex((c) => c.id === b.category));

export const CATEGORIES = categories;
export const categoryById = (id) => categories.find((c) => c.id === id);
export const caseById = (id) => CASES.find((c) => c.id === id);
export const caseUrl = (c) => (import.meta.env.DEV ? `./case.html?id=${c.id}` : `./case-${c.id}.html`);
export const DIFFICULTY = ['', 'קל', 'בינוני', 'מאתגר'];
