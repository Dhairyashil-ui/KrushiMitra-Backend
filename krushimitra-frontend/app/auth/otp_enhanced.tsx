import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  
  Animated,
  KeyboardAvoidingView,
  Platform
  
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lock } from 'lucide-react-native';

export default function OTPScreen() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const router = useRouter();
  const otpRefs = useRef<TextInput[]>([]);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const energyBar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      })
    ]).start();

    // Continuous animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Particle animations
    Animated.loop(
      Animated.timing(particle1, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(particle2, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Energy bar animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(energyBar, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(energyBar, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        })
      ])
    ).start();
  }, []);

  // Enhanced OTP Input Component
  const OTPInput = ({ index, value, onChangeText, focused }: {
    index: number;
    value: string;
    onChangeText: (text: string) => void;
    focused: boolean;
  }) => {
    const inputScale = useRef(new Animated.Value(0.8)).current;
    const inputOpacity = useRef(new Animated.Value(0)).current;
    const glowAnimation = useRef(new Animated.Value(0)).current;
    const pulseAnimation = useRef(new Animated.Value(1)).current;
    const borderAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Staggered entrance animation with bounce
      const delay = index * 150;
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(inputScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 120,
            friction: 6,
          }),
          Animated.timing(inputOpacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ]).start();
      }, delay);

      // Continuous pulse glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0.2,
            duration: 1800,
            useNativeDriver: true,
          })
        ])
      ).start();

      // Border animation
      Animated.loop(
        Animated.timing(borderAnimation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    }, []);

    useEffect(() => {
      if (focused) {
        Animated.parallel([
          Animated.spring(inputScale, {
            toValue: 1.08,
            useNativeDriver: true,
            tension: 150,
            friction: 8,
          }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnimation, {
                toValue: 1.05,
                duration: 600,
                useNativeDriver: true,
              }),
              Animated.timing(pulseAnimation, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
              })
            ])
          ).start()
        ]);
      } else {
        pulseAnimation.stopAnimation();
        Animated.parallel([
          Animated.spring(inputScale, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
      }
    }, [focused]);

    const glowOpacity = glowAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1]
    });

    const borderRotation = borderAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });

    return (
      <Animated.View 
        style={[
          styles.otpInputContainer,
          {
            transform: [{ scale: inputScale }],
            opacity: inputOpacity,
          }
        ]}
      >
        {/* Rotating border effect */}
        <Animated.View 
          style={[
            styles.rotatingBorder,
            {
              transform: [{ rotate: borderRotation }],
              opacity: focused ? 0.8 : 0.3,
            }
          ]}
        />
        
        <LinearGradient
          colors={focused 
            ? ['rgba(0, 245, 255, 0.9)', 'rgba(0, 128, 255, 0.7)', 'rgba(65, 105, 225, 0.5)'] 
            : ['rgba(26, 26, 46, 0.95)', 'rgba(22, 33, 62, 0.85)', 'rgba(15, 52, 96, 0.75)']
          }
          style={styles.otpInputGradient}
        >
          {/* Enhanced glow effect */}
          <Animated.View 
            style={[
              styles.otpGlow,
              {
                opacity: glowOpacity,
                shadowColor: focused ? '#00F5FF' : '#4169E1',
                transform: [{ scale: pulseAnimation }],
              }
            ]} 
          />
          
          {/* Inner highlight */}
          <View style={[
            styles.innerHighlight,
            { backgroundColor: focused ? 'rgba(0, 245, 255, 0.1)' : 'rgba(65, 105, 225, 0.05)' }
          ]} />
          
          <TextInput
            style={[
              styles.otpInput,
              {
                color: focused ? '#FFFFFF' : '#E6F3FF',
                fontSize: value ? 28 : 24,
                fontWeight: value ? '700' : '500',
              }
            ]}
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            selectionColor="#00F5FF"
            placeholderTextColor="rgba(176, 196, 222, 0.4)"
            placeholder="⚬"
          />
          
          {/* Enhanced digital indicator */}
          {value && (
            <Animated.View 
              style={[
                styles.digitalIndicator,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            >
              <LinearGradient
                colors={['#00F5FF', '#0080FF']}
                style={styles.indicatorGradient}
              >
                <Text style={styles.digitalText}>✓</Text>
              </LinearGradient>
            </Animated.View>
          )}
          
          {/* Corner accents */}
          <View style={styles.cornerAccents}>
            <View style={[styles.cornerAccent, styles.topLeft]} />
            <View style={[styles.cornerAccent, styles.topRight]} />
            <View style={[styles.cornerAccent, styles.bottomLeft]} />
            <View style={[styles.cornerAccent, styles.bottomRight]} />
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-move to next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('⚠️ INVALID NEURAL SEQUENCE', 'Please complete the 6-digit quantum verification sequence');
      return;
    }

    setIsLoading(true);

    try {
      // Demo verification - accept any 6-digit OTP
      // In real app, verify with Firebase Auth
      
      // Get user data
      const pendingUser = await AsyncStorage.getItem('pendingUser');
      const pendingPhone = await AsyncStorage.getItem('pendingPhone');
      
      let userData;
      if (pendingUser) {
        userData = JSON.parse(pendingUser);
      } else if (pendingPhone) {
        userData = { phoneNumber: pendingPhone, name: 'User' };
      }

      // Store user session
      await AsyncStorage.setItem('userToken', 'neural_token_' + Date.now());
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Clean up pending data
      await AsyncStorage.removeItem('pendingUser');
      await AsyncStorage.removeItem('pendingPhone');

      setTimeout(() => {
        setIsLoading(false);
        // Navigate to home tabs after OTP verification
        router.replace('/(tabs)');
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('🔴 NEURAL ERROR', 'Quantum verification failed. Reinitializing neural sequence...');
    }
  };

  const resendOTP = () => {
    Alert.alert('📡 NEURAL TRANSMISSION', 'New quantum verification sequence transmitted to your neural interface');
    setOtp(['', '', '', '', '', '']);
    setFocusedIndex(-1);
  };

  const particle1Y = particle1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100]
  });

  const particle2Y = particle2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100]
  });

  const energyWidth = energyBar.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        style={styles.gradientContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.keyboardContainer}>
          {/* Animated particles */}
          <Animated.View 
            style={[
              styles.particle1,
              { transform: [{ translateY: particle1Y }] }
            ]} 
          />
          <Animated.View 
            style={[
              styles.particle2,
              { transform: [{ translateY: particle2Y }] }
            ]} 
          />
          
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.header}>
              <Animated.View 
                style={[
                  styles.logoContainer,
                  { transform: [{ scale: titleScale }] }
                ]}
              >
                <LinearGradient
                  colors={['#00F5FF', '#0080FF', '#4169E1']}
                  style={styles.logoGradient}
                >
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <Lock size={40} color="#FFFFFF" />
                  </Animated.View>
                </LinearGradient>
              </Animated.View>
              
              <Animated.Text 
                style={[
                  styles.title,
                  { transform: [{ scale: titleScale }] }
                ]}
              >
                ⚡ NEURAL VERIFICATION
              </Animated.Text>
              
              <Text style={styles.subtitle}>
                Enter the 6-digit quantum verification sequence transmitted to your neural interface
              </Text>
              
              <Animated.View style={[styles.energyBar, { width: energyWidth }]} />
            </View>

            <View style={styles.otpSection}>
              <View style={styles.otpLabel}>
                <Lock size={16} color="#00F5FF" />
                <Text style={styles.otpLabelText}>QUANTUM SEQUENCE</Text>
              </View>
              
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <OTPInput
                    key={index}
                    index={index}
                    value={digit}
                    focused={focusedIndex === index}
                    onChangeText={(value) => handleOtpChange(value, index)}
                  />
                ))}
              </View>
              
              {otp.some(digit => digit !== '') && (
                <View style={styles.digitIndicator} />
              )}
            </View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => handleVerifyOTP()}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading 
                  ? ['rgba(0, 245, 255, 0.3)', 'rgba(0, 128, 255, 0.3)', 'rgba(65, 105, 225, 0.3)']
                  : ['#00F5FF', '#0080FF', '#4169E1']
                }
                style={styles.buttonGradient}
              >
                <View style={styles.buttonContent}>
                  {isLoading && (
                    <View style={styles.loadingContainer}>
                      <Animated.View 
                        style={[
                          styles.loadingSpinner,
                          { transform: [{ rotate: '360deg' }] }
                        ]} 
                      />
                      <Text style={styles.verifyButtonText}>PROCESSING NEURAL SEQUENCE...</Text>
                    </View>
                  )}
                  {!isLoading && (
                    <Text style={styles.verifyButtonText}>
                      VERIFY NEURAL SEQUENCE
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <LinearGradient
                colors={['rgba(0, 245, 255, 0.1)', 'rgba(0, 128, 255, 0.1)', 'rgba(65, 105, 225, 0.1)']}
                style={styles.footerGradient}
              >
                <Text style={styles.resendText}>Neural sequence not received? </Text>
                <TouchableOpacity style={styles.resendContainer} onPress={resendOTP}>
                  <Lock size={12} color="#00ff88" />
                  <Text style={styles.resendLink}>RETRANSMIT</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Animated.View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  particle1: {
    position: 'absolute',
    right: 40,
    top: 150,
    width: 3,
    height: 3,
    backgroundColor: '#00d4ff',
    borderRadius: 1.5,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
  },
  particle2: {
    position: 'absolute',
    left: 30,
    top: 200,
    width: 2,
    height: 2,
    backgroundColor: '#00ff88',
    borderRadius: 1,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 212, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#00d4ff',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.5,
    opacity: 0.8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  energyBar: {
    height: 3,
    backgroundColor: '#00d4ff',
    borderRadius: 2,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  otpSection: {
    marginBottom: 40,
  },
  otpLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  otpLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  otpInputContainer: {
    position: 'relative',
    marginHorizontal: 10,
  },
  rotatingBorder: {
    position: 'absolute',
    width: 68,
    height: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#00F5FF',
    top: -4,
    left: -4,
    zIndex: 0,
  },
  otpInputGradient: {
    width: 60,
    height: 70,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  otpGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 1,
    elevation: 15,
  },
  innerHighlight: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: '30%',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    zIndex: 2,
    letterSpacing: 1,
  },
  digitalIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    shadowOpacity: 0.9,
    elevation: 8,
    zIndex: 3,
  },
  indicatorGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  digitalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cornerAccents: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  cornerAccent: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: '#00F5FF',
  },
  topLeft: {
    top: 2,
    left: 2,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 2,
    right: 2,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 2,
    left: 2,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 2,
    right: 2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  filledInput: {
    textShadowColor: 'rgba(0, 212, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  digitIndicator: {
    position: 'absolute',
    bottom: 5,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 3,
    backgroundColor: '#00d4ff',
    borderRadius: 2,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  verifyButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    marginBottom: 30,
  },
  buttonTouchable: {
    width: '100%',
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    alignItems: 'center',
  },
  footerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  resendText: {
    color: '#b0c4de',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resendLink: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 255, 136, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
});