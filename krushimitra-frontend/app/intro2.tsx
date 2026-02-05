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
import { ChevronRight, ChevronLeft, Users, Sparkles, Leaf, Wheat, Droplets, Sun, Cloud, Heart, MessageCircle } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function Intro2Screen() {
  const { t } = useTranslation();
  const router = useRouter();
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;
  
  // Floating animations for background elements
  const floatingHeart1 = useRef(new Animated.Value(0)).current;
  const floatingHeart2 = useRef(new Animated.Value(0)).current;
  const floatingMessage1 = useRef(new Animated.Value(0)).current;
  const floatingMessage2 = useRef(new Animated.Value(0)).current;
  const floatingLeaf1 = useRef(new Animated.Value(0)).current;
  const floatingLeaf2 = useRef(new Animated.Value(0)).current;

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

    // Start floating animations for community theme
    const startFloatingAnimations = () => {
      [floatingHeart1, floatingHeart2, floatingMessage1, floatingMessage2, floatingLeaf1, floatingLeaf2].forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: -15 + (index * 5),
              duration: 1800 + (index * 200),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 15 - (index * 3),
              duration: 1800 + (index * 200),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
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
    router.push('/intro3');
  };

  const handlePrevious = () => {
    // Clear auto-advance timer when user manually navigates
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    router.back();
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
        colors={['#87CEEB', '#E0F6FF', '#2196F3']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Floating Community Elements */}
      <Animated.View style={[styles.floatingElement, styles.heart1, { transform: [{ translateY: floatingHeart1 }] }]}>
        <Heart size={20} color="rgba(255, 105, 180, 0.6)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.heart2, { transform: [{ translateY: floatingHeart2 }] }]}>
        <Heart size={18} color="rgba(255, 105, 180, 0.4)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.message1, { transform: [{ translateY: floatingMessage1 }] }]}>
        <MessageCircle size={22} color="rgba(33, 150, 243, 0.5)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.message2, { transform: [{ translateY: floatingMessage2 }] }]}>
        <MessageCircle size={18} color="rgba(33, 150, 243, 0.3)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.leaf1, { transform: [{ translateY: floatingLeaf1 }] }]}>
        <Leaf size={20} color="rgba(76, 175, 80, 0.4)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.leaf2, { transform: [{ translateY: floatingLeaf2 }] }]}>
        <Leaf size={16} color="rgba(76, 175, 80, 0.3)" />
      </Animated.View>

      {/* Skip Button */}
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
        {/* Hero Section - Community */}
        <Animated.View 
          style={[
            styles.heroSection,
            { transform: [{ translateY: slideAnimation }] }
          ]}
        >
          <View style={styles.heroContainer}>
            <View style={styles.communityContainer}>
              <View style={styles.communityBackground}>
                <Users size={60} color="#2196F3" />
                <Text style={styles.communityEmoji}>🤝</Text>
              </View>
              <View style={styles.communityGlow} />
            </View>
            <Text style={styles.heroEmoji}>👥🌾</Text>
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
            <Sparkles size={16} color="#2196F3" />
            <Text style={styles.badgeText}>{t('intro.badge.community')}</Text>
          </View>
          
          <LinearGradient
            colors={['#1976D2', '#2196F3', '#42A5F5']}
            style={styles.titleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.title}>{t('intro.pages.page2.title')}</Text>
          </LinearGradient>
          
          <Text style={styles.subtitle}>{t('intro.pages.page2.subtitle')}</Text>
          <Text style={styles.description}>{t('intro.pages.page2.description')}</Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        {/* Leaf Progress Indicators */}
        <View style={styles.pageIndicator}>
          <Leaf size={16} color="#E5E7EB" />
          <Leaf size={20} color="#2196F3" style={styles.activeLeaf} />
          <Leaf size={16} color="#E5E7EB" />
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
            <ChevronLeft size={24} color="#2196F3" />
            <Text style={styles.previousButtonText}>{t('intro.navigation.previous')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={['#2196F3', '#1976D2']}
              style={styles.leafButtonGradient}
            >
              <Heart size={20} color="#FFFFFF" />
              <Text style={styles.nextButtonText}>{t('intro.navigation.next')}</Text>
              <ChevronRight size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  
  // Floating Elements
  floatingElement: {
    position: 'absolute',
    zIndex: 1,
  },
  heart1: {
    top: '20%',
    left: '15%',
  },
  heart2: {
    top: '30%',
    right: '20%',
  },
  message1: {
    top: '40%',
    left: '25%',
  },
  message2: {
    top: '50%',
    right: '15%',
  },
  leaf1: {
    top: '60%',
    left: '10%',
  },
  leaf2: {
    top: '70%',
    right: '25%',
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
    shadowColor: '#2196F3',
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
    color: '#1976D2',
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
  communityContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  communityBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  communityEmoji: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    fontSize: 24,
  },
  communityGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#2196F3',
    opacity: 0.2,
    top: -10,
    left: -10,
    zIndex: -1,
  },
  heroEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  gradient: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
    position: 'relative',
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  particle1: {
    top: '20%',
    left: '15%',
  },
  particle2: {
    top: '30%',
    right: '20%',
  },
  particle3: {
    bottom: '25%',
    left: '25%',
  },
  iconSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  illustration: {
    fontSize: 60,
    marginTop: 10,
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
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1976D2',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
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
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#2196F3',
    width: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  previousButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  nextButton: {
    borderRadius: 25,
    shadowColor: '#2196F3',
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
