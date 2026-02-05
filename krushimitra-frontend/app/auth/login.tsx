import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Easing,
  Alert,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Shield, Sparkles, User } from 'lucide-react-native';
import PageTransition from '@/components/PageTransition';
import { AnimatedView } from '@/components/AnimatedCompat';
import { replaceWithTransition } from '@/src/utils/navigation';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();



export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const isMobile = width < 768; // Consider screens narrower than 768px as mobile
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);


  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const [transitioning, setTransitioning] = useState(false);





  // Particle positions for background effect
  const particlePositions = useRef([
    new Animated.ValueXY({ x: -20, y: -20 }),
    new Animated.ValueXY({ x: 100, y: 50 }),
    new Animated.ValueXY({ x: 300, y: -20 }),
    new Animated.ValueXY({ x: -20, y: 200 }),
    new Animated.ValueXY({ x: 350, y: 300 }),
  ]).current;

  // Initialize animations
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
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle pulse effect for logo
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
      ])
    ).start();
  }, []);


  useEffect(() => {
    const resumeSession = async () => {
      try {
        const entries = await AsyncStorage.multiGet(['userData', 'authToken']);
        const hasUser = entries.find(([key]) => key === 'userData')?.[1];
        const hasToken = entries.find(([key]) => key === 'authToken')?.[1];
        if (hasUser && hasToken) {
          setTransitioning(true);
        }
      } catch (error) {
        console.warn('Failed to resume session from login screen:', error);
      }
    };

    resumeSession();
  }, []);

  // Handle navigation after transition
  useEffect(() => {
    if (transitioning) {
      router.replace('/(tabs)');
    }
  }, [transitioning]);

  const handleSendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      Alert.alert(t('error'), 'Please enter a valid email address');
      return;
    }
    setEmail(normalizedEmail);

    setCheckingUser(true);

    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      // First check if user exists
      const checkResponse = await fetch(`${BACKEND_URL}/auth/check-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail })
      });

      const checkData = await checkResponse.json();

      if (checkResponse.ok && checkData.exists) {
        // User exists, proceed with sending OTP
        setCheckingUser(false);
        setOtpLoading(true);

        const otpResponse = await fetch(`${BACKEND_URL}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail })
        });

        const otpData = await otpResponse.json();

        if (otpResponse.ok) {
          setShowOtpField(true);
          Alert.alert(t('success'), 'OTP sent to your email! Please check your inbox.');
        } else {
          Alert.alert(t('error'), otpData.error?.message || 'Failed to send OTP');
        }
        setOtpLoading(false);
      } else {
        // User doesn't exist, show popup to create account
        setCheckingUser(false);
        Alert.alert(
          'Account Not Found',
          'This email is not registered. Would you like to create a new account?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Create Account',
              onPress: () => router.push('/auth/signup')
            }
          ]
        );
      }
    } catch (error) {
      // If check-user endpoint doesn't exist, assume user exists and try sending OTP directly
      console.warn('Check user endpoint not available, proceeding with sending OTP directly:', error);

      // Proceed with sending OTP assuming the user might exist
      setCheckingUser(false);
      setOtpLoading(true);

      try {
        const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const otpResponse = await fetch(`${BACKEND_URL}/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail })
        });

        const otpData = await otpResponse.json();

        if (otpResponse.ok) {
          setShowOtpField(true);
          Alert.alert(t('success'), 'OTP sent to your email! Please check your inbox.');
        } else {
          // If sending OTP fails, it might be because user doesn't exist
          // So we show the account not found message
          Alert.alert(
            'Account Not Found',
            'This email is not registered. Would you like to create a new account?',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Create Account',
                onPress: () => router.push('/auth/signup')
              }
            ]
          );
          setShowOtpField(false);
        }
      } catch (otpError) {
        console.error('Error sending OTP:', otpError);
        Alert.alert(t('error'), 'Network error. Please try again.');
      } finally {
        setOtpLoading(false);
      }
    }
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !otp) {
      Alert.alert(t('error'), t('enterOTP'));
      return;
    }
    if (!normalizedEmail.includes('@')) {
      Alert.alert(t('error'), 'Please enter a valid email address');
      return;
    }
    setEmail(normalizedEmail);

    setLoading(true);

    try {
      const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, otp, language: i18n.language })
      });

      const data = await response.json();

      if (response.ok) {
        const userPayload = data?.user || data?.data?.user || null;
        const sessionToken = data?.token || data?.session?.token || null;

        if (userPayload) {
          await AsyncStorage.setItem('userData', JSON.stringify(userPayload));
        }
        if (sessionToken) {
          await AsyncStorage.setItem('authToken', sessionToken);
        } else {
          await AsyncStorage.removeItem('authToken');
        }

        setLoading(false);
        setTransitioning(true);
      } else {
        setLoading(false);
        Alert.alert(t('error'), data.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setLoading(false);
      Alert.alert(t('error'), 'Network error. Please try again.');
    }
  };



  const handleSignUp = () => {
    router.push('/auth/signup');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <PageTransition isActive={!transitioning} type="slideFromRight">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Animated Background Particles */}
          {particlePositions.map((position, index) => (
            <AnimatedView
              key={index}
              style={[
                styles.particle,
                {
                  transform: position.getTranslateTransform(),
                  opacity: fadeAnimation,
                  backgroundColor: index % 2 === 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(46, 125, 50, 0.15)',
                  width: 12 + index * 2,
                  height: 12 + index * 2,
                  borderRadius: 6 + index,
                }
              ]}
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
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <ArrowLeft size={24} color="#4CAF50" />
              </TouchableOpacity>

              <View style={styles.topCenter}>
                <Text style={styles.topTitle}>{t('login')}</Text>
              </View>

              <View style={styles.topPlaceholder} />
            </View>

            <View style={styles.content}>
              {/* Top Section - Logo with Enhanced Animation */}
              <AnimatedView style={[
                styles.topSection,
                {
                  opacity: fadeAnimation,
                  transform: [{ scale: scaleAnimation }],
                }
              ]}>
                <AnimatedView style={[
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
                        source={require('../logoai.jpg')}
                        style={styles.logoImage}
                        resizeMode="contain"
                      />
                    </View>
                  </LinearGradient>

                  {/* Glow Effect */}
                  <AnimatedView style={[
                    styles.glowEffect,
                    {
                      transform: [{ scale: pulseAnimation }],
                      opacity: pulseAnimation.interpolate({
                        inputRange: [1, 1.05],
                        outputRange: [0.3, 0.6]
                      })
                    }
                  ]} />
                </AnimatedView>

                {/* AI Badge */}
                <View style={styles.aiBadge}>
                  <Sparkles size={16} color="#FFFFFF" />
                  <Text style={styles.aiBadgeText}>{t('aiPowered')}</Text>
                </View>
              </AnimatedView>

              {/* Welcome Section */}
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>{t('welcomeBack')}</Text>
                <Text style={styles.welcomeSubtitle}>{t('loginSubtitle')}</Text>
              </View>

              {/* Middle Section - Form */}
              <View style={styles.formSection}>
                {/* Email Input with Send OTP Button */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL</Text>
                  <View style={isMobile ? styles.phoneInputColumn : styles.phoneInputRow}>
                    <View style={isMobile ? styles.phoneInputContainerFullWidth : styles.phoneInputContainer}>
                      <View style={styles.inputIconContainer}>
                        <User size={20} color="#4CAF50" />
                      </View>
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        isMobile ? styles.otpButtonFullWidth : styles.otpButton,
                        (otpLoading || checkingUser || !email || !email.includes('@')) && styles.otpButtonDisabled
                      ]}
                      onPress={handleSendOtp}
                      disabled={otpLoading || checkingUser || !email || !email.includes('@')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.otpButtonText}>
                        {checkingUser ? 'Checking...' : otpLoading ? t('loading') : t('getOTP')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>


                {/* OTP Input */}
                {showOtpField && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('enterOTP')}</Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIconContainer}>
                        <Shield size={20} color="#4CAF50" />
                      </View>
                      <TextInput
                        style={styles.input}
                        value={otp}
                        onChangeText={setOtp}
                        placeholder={t('enterOTP')}
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        maxLength={6}
                        autoComplete="sms-otp"
                        textContentType="oneTimeCode"
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Bottom Section - Login Button */}
              <View style={styles.bottomSection}>
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    (loading || !email || !showOtpField || !otp) && styles.loginButtonDisabled
                  ]}
                  onPress={handleLogin}
                  disabled={loading || !email || !showOtpField || !otp}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? t('loading') : t('login')}
                  </Text>
                </TouchableOpacity>





                {/* Sign Up Link */}
                <TouchableOpacity onPress={handleSignUp} style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>
                    {t('dontHaveAccount')} <Text style={styles.signUpLink}>{t('signup.createAccount')}</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </KeyboardAvoidingView>
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
  topPlaceholder: {
    width: 40,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
  },

  // Top Section
  topSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
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
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
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
    width: 100,
    height: 100,
  },
  glowEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 90,
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
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textShadowColor: 'rgba(46, 125, 50, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#757575',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Middle Section - Form
  formSection: {
    marginBottom: 40,
    gap: 24,
  },
  inputGroup: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  phoneInputColumn: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  phoneInputContainerFullWidth: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIconContainer: {
    marginRight: 12,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  otpButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  otpButtonFullWidth: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  otpButtonDisabled: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0.1,
  },
  otpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Bottom Section
  bottomSection: {
    alignItems: 'center',
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2E7D32',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  signUpContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  signUpText: {
    fontSize: 16,
    color: '#757575',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  signUpLink: {
    color: '#4CAF50',
    fontWeight: '700',
  },


});
