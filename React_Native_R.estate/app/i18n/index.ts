import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// Import type declarations
import './types';

// Import translation files
import en from './locales/en.json';
import sq from './locales/sq.json';

// Get device language - default to Albanian if not detected
const deviceLanguage = getLocales()[0]?.languageCode || 'sq';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sq: { translation: sq },
    },
    lng: deviceLanguage,
    fallbackLng: 'sq',
    defaultNS: 'translation',
    keySeparator: '.',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    debug: false,
  });

export default i18n;