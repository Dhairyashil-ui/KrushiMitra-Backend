import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Bot, Sparkles, Leaf, Wheat, Droplets, Sun, Cloud } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function Intro1Screen() {
  const { t } = useTranslation();
  const router = useRouter();
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;
  
  // Floating animations for background elements
  const floatingLeaf1 = useRef(new Animated.Value(0)).current;
  const floatingLeaf2 = useRef(new Animated.Value(0)).current;
  const floatingDroplet1 = useRef(new Animated.Value(0)).current;
  const floatingDroplet2 = useRef(new Animated.Value(0)).current;
  const floatingSeed1 = useRef(new Animated.Value(0)).current;
  const floatingSeed2 = useRef(new Animated.Value(0)).current;

  // Auto-advance timer
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);

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
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Start floating animations
    const startFloatingAnimations = () => {
      // Floating leaves
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingLeaf1, {
            toValue: -15,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(floatingLeaf1, {
            toValue: 15,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingLeaf2, {
            toValue: 20,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(floatingLeaf2, {
            toValue: -10,
            duration: 2500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Floating droplets
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingDroplet1, {
            toValue: -12,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(floatingDroplet1, {
            toValue: 12,
            duration: 1800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingDroplet2, {
            toValue: 18,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(floatingDroplet2, {
            toValue: -8,
            duration: 2200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Floating seeds
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingSeed1, {
            toValue: -10,
            duration: 1600,
            useNativeDriver: true,
          }),
          Animated.timing(floatingSeed1, {
            toValue: 10,
            duration: 1600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatingSeed2, {
            toValue: 14,
            duration: 1900,
            useNativeDriver: true,
          }),
          Animated.timing(floatingSeed2, {
            toValue: -14,
            duration: 1900,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startFloatingAnimations();

    // Set up auto-advance timer (4 seconds)
    autoAdvanceTimer.current = setTimeout(() => {
      handleNext();
    }, 4000);

    // Cleanup timer on unmount
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  const handleNext = () => {
    // Clear auto-advance timer when user manually navigates
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    router.push('/intro2');
  };

  const handleSkip = () => {
    // Clear auto-advance timer when user skips
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    router.replace('/language');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sky to Field Gradient Background */}
      <LinearGradient
        colors={['#87CEEB', '#98FB98', '#228B22']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Circuit Pattern Overlay */}
      <View style={styles.circuitOverlay} />

      {/* Floating Background Elements */}
      <Animated.View style={[styles.floatingElement, styles.leaf1, { transform: [{ translateY: floatingLeaf1 }] }]}>
        <Leaf size={24} color="rgba(76, 175, 80, 0.6)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.leaf2, { transform: [{ translateY: floatingLeaf2 }] }]}>
        <Leaf size={20} color="rgba(76, 175, 80, 0.4)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.droplet1, { transform: [{ translateY: floatingDroplet1 }] }]}>
        <Droplets size={18} color="rgba(30, 144, 255, 0.5)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.droplet2, { transform: [{ translateY: floatingDroplet2 }] }]}>
        <Droplets size={16} color="rgba(30, 144, 255, 0.3)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.seed1, { transform: [{ translateY: floatingSeed1 }] }]}>
        <Text style={styles.seedEmoji}>🌱</Text>
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.seed2, { transform: [{ translateY: floatingSeed2 }] }]}>
        <Text style={styles.seedEmoji}>🌾</Text>
      </Animated.View>

      {/* Background Farming Illustrations */}
      <View style={styles.backgroundIllustrations}>
        <Sun size={40} color="rgba(255, 215, 0, 0.3)" style={styles.sunIcon} />
        <Cloud size={35} color="rgba(255, 255, 255, 0.4)" style={styles.cloudIcon1} />
        <Cloud size={30} color="rgba(255, 255, 255, 0.3)" style={styles.cloudIcon2} />
        <Wheat size={50} color="rgba(218, 165, 32, 0.2)" style={styles.wheatIcon1} />
        <Wheat size={45} color="rgba(218, 165, 32, 0.15)" style={styles.wheatIcon2} />
      </View>

      {/* Skip Button with Plant Sprout */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.sproutEmoji}>🌱</Text>
        <Text style={styles.skipButtonText}>{t('intro.navigation.skip')}</Text>
      </TouchableOpacity>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnimation,
            transform: [{ scale: scaleAnimation }],
          }
        ]}
      >
        {/* Hero Section - Farming Robot */}
        <Animated.View 
          style={[
            styles.heroSection,
            { transform: [{ translateY: slideAnimation }] }
          ]}
        >
          <View style={styles.heroContainer}>
            {/* Farming AI Robot Illustration */}
            <View style={styles.robotContainer}>
              <View style={styles.robotBackground}>
                <Bot size={60} color="#4CAF50" />
                <Text style={styles.plantEmoji}>🌿</Text>
              </View>
              <View style={styles.robotGlow} />
            </View>
            <Text style={styles.heroEmoji}>🤖🌾</Text>
          </View>
        </Animated.View>

        {/* Content Section */}
        <Animated.View 
          style={[
            styles.textSection,
            { transform: [{ translateY: slideAnimation }] }
          ]}
        >
          <View style={styles.badgeContainer}>
            <Sparkles size={16} color="#4CAF50" />
            <Text style={styles.badgeText}>{t('intro.badge.ai')}</Text>
          </View>
          
          {/* Gradient Title */}
          <LinearGradient
            colors={['#2E7D32', '#4CAF50', '#66BB6A']}
            style={styles.titleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.title}>{t('intro.pages.page1.title')}</Text>
          </LinearGradient>
          
          <Text style={styles.subtitle}>{t('intro.pages.page1.subtitle')}</Text>
          <Text style={styles.description}>{t('intro.pages.page1.description')}</Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        {/* Leaf Progress Indicators */}
        <View style={styles.pageIndicator}>
          <Leaf size={20} color="#4CAF50" style={styles.activeLeaf} />
          <Leaf size={16} color="#E5E7EB" />
          <Leaf size={16} color="#E5E7EB" />
        </View>

        {/* Leaf-shaped Next Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={styles.leafButtonGradient}
          >
            <Wheat size={20} color="#FFFFFF" />
            <Text style={styles.nextButtonText}>{t('intro.navigation.next')}</Text>
            <ChevronRight size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  
  // Circuit Pattern Overlay
  circuitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.1,
    // Add circuit pattern using border styles
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    borderStyle: 'dashed',
  },

  // Floating Elements
  floatingElement: {
    position: 'absolute',
    zIndex: 1,
  },
  leaf1: {
    top: '15%',
    left: '10%',
  },
  leaf2: {
    top: '25%',
    right: '15%',
  },
  droplet1: {
    top: '35%',
    left: '20%',
  },
  droplet2: {
    top: '45%',
    right: '25%',
  },
  seed1: {
    top: '55%',
    left: '15%',
  },
  seed2: {
    top: '65%',
    right: '20%',
  },
  seedEmoji: {
    fontSize: 20,
  },

  // Background Illustrations
  backgroundIllustrations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  sunIcon: {
    position: 'absolute',
    top: '8%',
    right: '10%',
  },
  cloudIcon1: {
    position: 'absolute',
    top: '12%',
    left: '20%',
  },
  cloudIcon2: {
    position: 'absolute',
    top: '18%',
    right: '30%',
  },
  wheatIcon1: {
    position: 'absolute',
    bottom: '15%',
    left: '5%',
  },
  wheatIcon2: {
    position: 'absolute',
    bottom: '20%',
    right: '8%',
  },

  // Skip Button with Plant Sprout
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    gap: 6,
  },
  sproutEmoji: {
    fontSize: 16,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // Main Content Container
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  robotContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  robotBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  plantEmoji: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    fontSize: 24,
  },
  robotGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#4CAF50',
    opacity: 0.2,
    top: -10,
    left: -10,
    zIndex: -1,
  },
  heroEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },

  // Text Section
  textSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 30,
    paddingVertical: 25,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },

  // Gradient Title
  titleGradient: {
    borderRadius: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },

  // Bottom Navigation
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 3,
  },

  // Leaf Progress Indicators
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeLeaf: {
    transform: [{ scale: 1.2 }],
  },

  // Leaf-shaped Next Button
  nextButton: {
    borderRadius: 25,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  leafButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 25,
    gap: 8,
    minWidth: 160,
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
