import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Image,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Wheat, CheckCircle, ArrowLeft, Sparkles, Mic, MicOff } from 'lucide-react-native';
import PageTransition from '@/components/PageTransition';
import { replaceWithTransition } from '@/src/utils/navigation';
import { changeLanguage as i18nChangeLanguage } from '@/i18n';
import { useLanguage } from '@/src/context/LanguageContext';
// Import speech recognition for voice input
import { useSpeechRecognitionEvent, ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export default function LanguageScreen() {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [isListening, setIsListening] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.3)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const particlesAnimation = useRef(new Animated.Value(0)).current;
  const [transitioning, setTransitioning] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Cross-platform error handling function
  const showError = (msg: string) => {
    if (Platform.OS === 'web') {
      console.error(msg);
    } else {
      Alert.alert("त्रुटि", msg);
    }
  };

  // Set up event listeners for expo-speech-recognition on mobile
  useSpeechRecognitionEvent('start', () => {
    if (Platform.OS !== 'web') {
      console.log('Speech started');
      setIsListening(true);
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (Platform.OS !== 'web') {
      console.log('Speech ended');
      setIsListening(false);
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    if (Platform.OS !== 'web') {
      console.log('Speech results:', event);
      if (event.results && event.results.length > 0) {
        const transcript = event.results[0].transcript.toLowerCase().trim();
        handleVoiceInput(transcript);
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (Platform.OS !== 'web') {
      console.error('Speech recognition error:', event);
      setIsListening(false);
      showError('There was an error with speech recognition. Please try again.');
    }
  });

  // Particle positions for background effect
  const particlePositions = useRef([
    new Animated.ValueXY({ x: -20, y: -20 }),
    new Animated.ValueXY({ x: 100, y: 50 }),
    new Animated.ValueXY({ x: 300, y: -20 }),
    new Animated.ValueXY({ x: -20, y: 200 }),
    new Animated.ValueXY({ x: 350, y: 300 }),
  ]).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.elastic(1.3),
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle pulse effect for logo after entrance
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1200);

    // Floating animation for particles
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Particle animations
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(particlePositions[0], {
            toValue: { x: 50, y: 30 },
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[0], {
            toValue: { x: -20, y: -20 },
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[1], {
            toValue: { x: 150, y: 100 },
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[1], {
            toValue: { x: 100, y: 50 },
            duration: 5000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[2], {
            toValue: { x: 350, y: 30 },
            duration: 4500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[2], {
            toValue: { x: 300, y: -20 },
            duration: 4500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[3], {
            toValue: { x: 30, y: 250 },
            duration: 5500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[3], {
            toValue: { x: -20, y: 200 },
            duration: 5500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particlePositions[4], {
            toValue: { x: 400, y: 350 },
            duration: 6000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(particlePositions[4], {
            toValue: { x: 350, y: 300 },
            duration: 6000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Initialize speech recognition
    initializeSpeechRecognition();

    // Start voice prompt after animations
    setTimeout(() => {
      speakWelcomeAndPrompt();
    }, 1000);

    // Cleanup function
    return () => {
      // No cleanup needed for expo-speech-recognition
      // Events are automatically cleaned up
    };
  }, []);

  useEffect(() => {
    if (transitioning) {
      replaceWithTransition('/auth/login');
    }
  }, [transitioning]);

  const initializeSpeechRecognition = () => {
    if (Platform.OS === 'web') {
      // Web implementation
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.toLowerCase().trim();
          setIsListening(false);
          handleVoiceInput(transcript);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          showError('There was an error with speech recognition. Please try again.');
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        console.warn('Speech recognition not supported in this browser');
      }
    }
    // Mobile implementation is handled by useSpeechRecognitionEvent hook
    // No need to set up event listeners here
  };

  const speakWelcomeAndPrompt = () => {
    console.log('Welcome message - using ONLY Niraj Hindi voice from 11labs');
    // ONLY use 11labs Niraj Hindi voice - NO device TTS fallbacks
    // User explicitly requested ONLY Niraj Hindi voice
    
    // Start listening directly without device TTS
    setTimeout(() => {
      startListening();
    }, 500);
  };

  const startListening = () => {
    if (Platform.OS === 'web') {
      // Web implementation
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          showError('Could not start voice recognition. Please ensure your browser supports it and you have given microphone permissions.');
        }
      } else {
        showError('Voice recognition is only available on web platform.');
      }
    } else {
      // Mobile implementation using expo-speech-recognition
      console.log('Starting voice recognition on mobile');
      try {
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: false,
          maxAlternatives: 1,
          continuous: false,
          requiresOnDeviceRecognition: false,
        });
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        showError('Please allow microphone access in your device settings to use voice recognition.');
      }
    }
  };

  const stopListening = () => {
    if (Platform.OS === 'web') {
      // Web implementation
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    } else {
      // Mobile implementation using expo-speech-recognition
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    }
  };

  const handleVoiceInput = (text: string) => {
    console.log('Voice input received:', text);
    
    // Match voice input to languages
    let languageCode = '';
    if (text.includes('hindi') || text.includes('हिंदी')) {
      languageCode = 'hi';
    } else if (text.includes('malayalam') || text.includes('മലയാളം')) {
      languageCode = 'ml';
    } else if (text.includes('english')) {
      languageCode = 'en';
    }
    
    // If a valid language was detected
    if (languageCode) {
      setSelectedLanguage(languageCode);
      setShowWelcome(false);
      // Automatically continue after a 2-second delay
      setTimeout(() => {
        autoContinue(languageCode);
      }, 2000);
    } else {
      // Do nothing for unrecognized input
      console.log('Unrecognized language input');
    }
  };

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const autoContinue = async (languageCode: string) => {
    if (!languageCode) return;
    
    try {
      // Use the context's changeLanguage function
      await changeLanguage(languageCode);
      
      // Trigger transition before navigation
      setTransitioning(true);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const handleContinue = async () => {
    if (!selectedLanguage) return;
    
    try {
      // Use the context's changeLanguage function
      await changeLanguage(selectedLanguage);
      
      // Trigger transition before navigation
      setTransitioning(true);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  return (
    <PageTransition isActive={!transitioning} type="slide">
      <SafeAreaView style={styles.container}>
        {/* Animated Background Particles */}
        {particlePositions.map((position, index) => (
          <Animated.View
            key={index}
            style={[styles.particle, {
              transform: position.getTranslateTransform(),
              opacity: fadeAnimation,
              backgroundColor: index % 2 === 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(46, 125, 50, 0.15)',
              width: 12 + index * 2,
              height: 12 + index * 2,
              borderRadius: 6 + index,
            }]}
          />
        ))}

        <LinearGradient
          colors={['#FFFFFF', '#F1F8E9', '#E8F5E8']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.3 }}
        >
          {/* Top Navigation */}
          <View style={styles.topNavigation}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => replaceWithTransition('/')}
            >
              <ArrowLeft size={24} color="#4CAF50" />
            </TouchableOpacity>
            
            <View style={styles.topCenter}>
              <Text style={styles.topTitle}>Language</Text>
            </View>
            
            {/* Microphone Button */}
            <TouchableOpacity 
              style={styles.micButton}
              onPress={isListening ? stopListening : startListening}
            >
              {isListening ? (
                <MicOff size={24} color="#FFFFFF" />
              ) : (
                <Mic size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Top Section - Logo with Enhanced Animation */}
          <Animated.View style={[
            styles.topSection,
            {
              opacity: fadeAnimation,
              transform: [{ scale: scaleAnimation }],
            }
          ]}>
            <Animated.View style={[
              styles.logoContainer,
              {
                transform: [{ scale: pulseAnimation }],
              }
            ]}>
              <LinearGradient
                colors={['#4CAF50', '#2E7D32', '#4CAF50']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.logoWrapper}>
                  <Image 
                    source={require('./logoai.jpg')} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </LinearGradient>
              
              {/* Glow Effect */}
              <Animated.View style={[
                styles.glowEffect,
                {
                  transform: [{ scale: pulseAnimation }],
                  opacity: pulseAnimation.interpolate({
                    inputRange: [1, 1.05],
                    outputRange: [0.3, 0.6]
                  })
                }
              ]} />
            </Animated.View>
            
            {/* AI Badge */}
            <View style={styles.aiBadge}>
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.aiBadgeText}>AI Powered</Text>
            </View>
          </Animated.View>
          
          {/* Heading Section */}
          <View style={styles.headingSection}>
            {showWelcome ? (
              <Text style={styles.mainHeading}>Welcome to KrushiMitra</Text>
            ) : (
              <Text style={styles.mainHeading}>Choose Your Language</Text>
            )}
            <Text style={styles.subHeading}>
              {showWelcome 
                ? "What language do you prefer?" 
                : "Select your preferred language for the AI assistant"}
            </Text>
          </View>
          
          {/* Language Options Section */}
          <ScrollView style={styles.languageScrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.languagesContainer}>
              {availableLanguages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageButton,
                    selectedLanguage === language.code && styles.selectedLanguageButton,
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageContent}>
                    <View style={styles.languageTextContainer}>
                      <Text style={[
                        styles.languageName,
                        selectedLanguage === language.code && styles.selectedLanguageName,
                      ]}>
                        {language.name}
                      </Text>
                      <Text style={[
                        styles.nativeLanguageName,
                        selectedLanguage === language.code && styles.selectedNativeLanguageName,
                      ]}>
                        {language.nativeName}
                      </Text>
                    </View>
                    
                    {selectedLanguage === language.code && (
                      <View style={styles.checkIconContainer}>
                        <CheckCircle size={24} color="#4CAF50" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          {/* Bottom Section - Continue Button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={[
                styles.continueButton,
                !selectedLanguage && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              disabled={!selectedLanguage}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </PageTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  particle: {
    position: 'absolute',
    zIndex: 0,
  },
  backgroundGradient: {
    flex: 1,
  },
  
  // Top Navigation
  topNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Top Section
  topSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  logoContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  glowEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 80,
    backgroundColor: '#4CAF50',
    opacity: 0.4,
    zIndex: -1,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Heading Section
  headingSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 30,
  },
  mainHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textShadowColor: 'rgba(46, 125, 50, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subHeading: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  
  // Language Options Section
  languageScrollContainer: {
    flex: 1,
    paddingHorizontal: 32,
  },
  languagesContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  languageButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedLanguageButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectedLanguageName: {
    color: '#2E7D32',
  },
  nativeLanguageName: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  selectedNativeLanguageName: {
    color: '#4CAF50',
  },
  checkIconContainer: {
    marginLeft: 16,
  },
  
  // Bottom Section
  bottomSection: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  continueButtonDisabled: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0.1,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
