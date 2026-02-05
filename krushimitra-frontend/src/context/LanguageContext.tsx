import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  availableLanguages: Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('hi');
  const [isLoading, setIsLoading] = useState(true);

  const availableLanguages = [
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  ];

  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    try {
      setIsLoading(true);
      
      // Check if language is already set in AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('user-language');
      
      if (savedLanguage && availableLanguages.some(lang => lang.code === savedLanguage)) {
        setCurrentLanguage(savedLanguage);
        await i18n.changeLanguage(savedLanguage);
      } else {
        // Set default language to Hindi
        setCurrentLanguage('hi');
        await i18n.changeLanguage('hi');
        await AsyncStorage.setItem('user-language', 'hi');
      }
    } catch (error) {
      console.error('Error initializing language:', error);
      // Fallback to Hindi
      setCurrentLanguage('hi');
      await i18n.changeLanguage('hi');
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (languageCode: string) => {
    try {
      // Validate language code
      if (!availableLanguages.some(lang => lang.code === languageCode)) {
        throw new Error(`Language code '${languageCode}' is not supported`);
      }

      setIsLoading(true);
      
      // Change language in i18n
      await i18n.changeLanguage(languageCode);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('user-language', languageCode);
      
      // Update state
      setCurrentLanguage(languageCode);
      
      console.log(`भाषा बदली गई: ${languageCode}`);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    availableLanguages,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;