import translations from './translations';

const SUPPORTED = ['ko', 'en', 'ja', 'zh-CN', 'es', 'th'];

function detectBrowserLang() {
  const bl = navigator.language || 'ko';
  if (bl.startsWith('ko')) return 'ko';
  if (bl.startsWith('ja')) return 'ja';
  if (bl.startsWith('zh')) return 'zh-CN';
  if (bl.startsWith('es')) return 'es';
  if (bl.startsWith('th')) return 'th';
  return 'en';
}

export function getLang() {
  const saved = localStorage.getItem('cc_lang');
  if (saved && SUPPORTED.includes(saved)) return saved;
  return detectBrowserLang();
}

export function useT() {
  const lang = getLang();
  const dict = translations[lang] || translations.ko;
  const fallback = translations.ko;

  const t = (key) => dict[key] ?? fallback[key] ?? key;

  return { t, lang };
}
