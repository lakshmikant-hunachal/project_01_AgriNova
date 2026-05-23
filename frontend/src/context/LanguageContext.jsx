import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi (हिंदी)', flag: '🇮🇳' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu (తెలుగు)', flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil (தமிழ்)', flag: '🇮🇳' },
  { code: 'mr', label: 'Marathi (मराठी)', flag: '🇮🇳' },
  { code: 'bn', label: 'Bengali (বাংলা)', flag: '🇮🇳' },
  { code: 'gu', label: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam (മലയാളം)', flag: '🇮🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' }
];

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('app_language', newLang);
  };

  // Helper to fetch nested translations e.g. t('home.hero.title')
  const t = (key) => {
    const keys = key.split('.');
    let value = translations[lang];

    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to English translation
        let fallbackValue = translations['en'];
        for (const fk of keys) {
          if (fallbackValue && fallbackValue[fk] !== undefined) {
            fallbackValue = fallbackValue[fk];
          } else {
            fallbackValue = key;
            break;
          }
        }
        return fallbackValue;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
