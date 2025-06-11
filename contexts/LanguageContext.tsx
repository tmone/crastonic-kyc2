import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, TranslationKey, loadTranslations, availableLanguages } from '../utils/translationUtils';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  availableLanguages: typeof availableLanguages;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved language preference and translations
  useEffect(() => {
    const initializeLanguage = async () => {
      setIsLoading(true);
      try {
        // Get saved language or default to English
        const savedLanguage = await AsyncStorage.getItem('language');
        const lang = savedLanguage as Language || 'en';
        
        if (savedLanguage && availableLanguages.some(l => l.code === savedLanguage)) {
          setLanguageState(savedLanguage as Language);
        }
        
        // Load translations for the language
        const translationsData = await loadTranslations(lang);
        setTranslations(translationsData);
      } catch (error) {
        console.error('Error initializing language:', error);
        // Load English as fallback
        const englishTranslations = await loadTranslations('en');
        setTranslations(englishTranslations);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeLanguage();
  }, []);

  // Update language and load new translations
  const setLanguage = async (newLanguage: Language) => {
    try {
      setIsLoading(true);
      setLanguageState(newLanguage);
      
      // Load translations for new language
      const translationsData = await loadTranslations(newLanguage);
      setTranslations(translationsData);
      
      // Save language preference
      await AsyncStorage.setItem('language', newLanguage);
    } catch (error) {
      console.error(`Error setting language to ${newLanguage}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Translation function with parameter support
  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    let text = translations[key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, value);
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      availableLanguages,
      isLoading 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}