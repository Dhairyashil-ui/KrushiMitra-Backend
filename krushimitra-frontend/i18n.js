import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './app/locales/en.json';
import hi from './app/locales/hi.json';
import mr from './app/locales/mr.json';
import ml from './app/locales/ml.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Try to get saved language from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      
      // Fallback to device language
      const deviceLanguage = Localization.getLocales()[0]?.languageCode;
      const supportedLanguages = ['en', 'hi', 'mr', 'ml'];
      
      if (supportedLanguages.includes(deviceLanguage)) {
        callback(deviceLanguage);
      } else {
        callback('hi'); // Default fallback to Hindi
      }
    } catch (error) {
      console.log('Error detecting language:', error);
      callback('hi'); // Default fallback to Hindi
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  },
};

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  ml: { translation: ml },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'hi',
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Function to change language and save to AsyncStorage
export const changeLanguage = async (languageCode) => {
  try {
    await i18n.changeLanguage(languageCode);
    await AsyncStorage.setItem('user-language', languageCode);
  } catch (error) {
    console.log('Error changing language:', error);
  }
};

export default i18n;
