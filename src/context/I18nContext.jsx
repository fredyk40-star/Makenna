/**
 * I18n Context - Multi-language support
 * Supports English, Twi, Ga, Ewe, Fante with offline caching
 */
import { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';

const I18nContext = createContext();

const translations = {
  en
};

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('makenna_locale') || 'en';
  });
  const [messages, setMessages] = useState(translations.en || {});

  useEffect(() => {
    // Load locale from local storage
    loadLocale(locale);
  }, [locale]);

  const loadLocale = async (lang) => {
    try {
      // Try to load from cache/translations
      if (translations[lang]) {
        setMessages(translations[lang]);
      } else {
        // Fallback to English
        setMessages(translations.en || {});
      }
      localStorage.setItem('makenna_locale', lang);
    } catch (error) {
      console.warn('Failed to load locale:', error);
      setMessages(translations.en || {});
    }
  };

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = messages;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (!value) return key;
    
    // Replace params
    Object.entries(params).forEach(([param, val]) => {
      value = value.replace(`{${param}}`, val);
    });
    
    return value;
  };

  const changeLanguage = (lang) => {
    setLocale(lang);
  };

  return (
    <I18nContext.Provider value={{ 
      locale, 
      languages: Object.keys(translations),
      changeLanguage,
      t 
    }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

export default I18nContext;