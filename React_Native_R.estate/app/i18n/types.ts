import 'react-i18next';

// Import your default translation file
declare module 'react-i18next' {
  interface CustomTypeOptions {
    // Set default namespace
    defaultNS: 'translation';
    
    // Disable type checking for translation keys
    // This allows any string to be used as a translation key
    resources: {
      translation: any;
    };
  }
}

export {};