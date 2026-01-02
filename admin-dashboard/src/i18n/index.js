import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import sq from './locales/sq.json';

// Get saved language from localStorage or default to Albanian
const savedLanguage = localStorage.getItem('admin_language') || 'sq';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sq: { translation: sq },
    },
    lng: savedLanguage,
    fallbackLng: 'sq',
    defaultNS: 'translation',
    keySeparator: '.',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('admin_language', lng);
});

export default i18n;
