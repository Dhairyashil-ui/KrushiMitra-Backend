import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ChevronDown, 
  Check, 
  Globe, 
  ArrowLeft,
  Languages
} from 'lucide-react-native';
import { changeLanguage } from '../i18n';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
];

export default function LanguageSelectionScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // Consider screens narrower than 768px as mobile
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

  useEffect(() => {
    // Set current language as selected
    const currentLang = languages.find(lang => lang.code === i18n.language);
    if (currentLang) {
      setSelectedLanguage(currentLang);
    }
  }, [i18n.language]);

  const handleLanguageSelect = async (language: Language) => {
    try {
      await changeLanguage(language.code);
      setSelectedLanguage(language);
      setIsDropdownOpen(false);
      
      // Show success message
      Alert.alert(
        t('success'),
        `भाषा ${language.nativeName} में बदली गई`,
        [{ text: t('ok') }]
      );
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('error'),
        'भाषा बदलने में असफल। कृपया पुनः प्रयास करें।',
        [{ text: t('ok') }]
      );
    }
  };

  const handleContinue = () => {
    router.push('/auth/login');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4CAF50', '#2E7D32', '#1B5E20']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Globe size={24} color="#FFFFFF" />
            <Text style={styles.headerTitle}>{t('selectLanguage')}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <View style={styles.iconContainer}>
            <Languages size={48} color="#4CAF50" />
          </View>
          <Text style={styles.welcomeTitle}>{t('welcomeToKrushiMitra')}</Text>
          <Text style={styles.welcomeSubtitle}>{t('yourFarmingAssistant')}</Text>
        </View>

        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>{t('selectLanguage')}</Text>
          <Text style={styles.sectionSubtitle}>
            ऐप के लिए अपनी पसंदीदा भाषा चुनें
          </Text>

          {/* Mobile: Show all languages as cards, Desktop: Dropdown */}
          {isMobile ? (
            // Mobile: Card List View
            <View style={styles.languageCardsContainer}>
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageCard,
                    selectedLanguage.code === language.code && styles.selectedCard
                  ]}
                  onPress={() => handleLanguageSelect(language)}
                >
                  <View style={styles.cardContent}>
                    <Text style={styles.cardFlag}>{language.flag}</Text>
                    <View style={styles.cardInfo}>
                      <Text style={[
                        styles.cardName,
                        selectedLanguage.code === language.code && styles.selectedCardText
                      ]}>
                        {language.nativeName}
                      </Text>
                      <Text style={[
                        styles.cardCode,
                        selectedLanguage.code === language.code && styles.selectedCardSubtext
                      ]}>
                        {language.name}
                      </Text>
                    </View>
                  </View>
                  {selectedLanguage.code === language.code && (
                    <View style={styles.checkContainer}>
                      <Check size={24} color="#4CAF50" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // Desktop: Dropdown View
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <View style={styles.dropdownContent}>
                  <Text style={styles.flagText}>{selectedLanguage.flag}</Text>
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{selectedLanguage.nativeName}</Text>
                    <Text style={styles.languageCode}>{selectedLanguage.name}</Text>
                  </View>
                </View>
                <ChevronDown 
                  size={20} 
                  color="#666" 
                  style={[
                    styles.chevron,
                    isDropdownOpen && styles.chevronRotated
                  ]} 
                />
              </TouchableOpacity>

              {/* Dropdown Options */}
              {isDropdownOpen && (
                <View style={styles.dropdownOptions}>
                  {languages.map((language) => (
                    <TouchableOpacity
                      key={language.code}
                      style={[
                        styles.dropdownOption,
                        selectedLanguage.code === language.code && styles.selectedOption
                      ]}
                      onPress={() => handleLanguageSelect(language)}
                    >
                      <View style={styles.optionContent}>
                        <Text style={styles.optionFlag}>{language.flag}</Text>
                        <View style={styles.optionInfo}>
                          <Text style={[
                            styles.optionName,
                            selectedLanguage.code === language.code && styles.selectedOptionText
                          ]}>
                            {language.nativeName}
                          </Text>
                          <Text style={[
                            styles.optionCode,
                            selectedLanguage.code === language.code && styles.selectedOptionText
                          ]}>
                            {language.name}
                          </Text>
                        </View>
                      </View>
                      {selectedLanguage.code === language.code && (
                        <Check size={20} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.continueSection}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.continueGradient}
            >
              <Text style={styles.continueText}>{t('continue')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  languageSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  // Mobile: Card List Styles
  languageCardsContainer: {
    gap: 12,
  },
  languageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  cardCode: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedCardText: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  selectedCardSubtext: {
    color: '#2E7D32',
  },
  checkContainer: {
    marginLeft: 12,
  },
  // Desktop: Dropdown Styles
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagText: {
    fontSize: 24,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  languageCode: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  chevron: {
    marginLeft: 12,
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1001,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  optionCode: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedOptionText: {
    color: '#4CAF50',
  },
  continueSection: {
    paddingBottom: 40,
  },
  continueButton: {
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
