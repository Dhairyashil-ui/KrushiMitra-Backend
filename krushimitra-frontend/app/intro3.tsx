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
import { ChevronRight, ChevronLeft, Activity, Sparkles, Leaf, Wheat, Droplets, Sun, Cloud, BarChart3, TrendingUp } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function Intro3Screen() {
  const { t } = useTranslation();
  const router = useRouter();
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const slideAnimation = useRef(new Animated.Value(50)).current;
  
  // Floating animations for background elements
  const floatingChart1 = useRef(new Animated.Value(0)).current;
  const floatingChart2 = useRef(new Animated.Value(0)).current;
  const floatingTrend1 = useRef(new Animated.Value(0)).current;
  const floatingTrend2 = useRef(new Animated.Value(0)).current;
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

    // Start floating animations for activity tracking theme
    const startFloatingAnimations = () => {
      [floatingChart1, floatingChart2, floatingTrend1, floatingTrend2, floatingLeaf1, floatingLeaf2].forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: -12 + (index * 4),
              duration: 1700 + (index * 150),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 12 - (index * 2),
              duration: 1700 + (index * 150),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    };
    startFloatingAnimations();

    // Set up auto-advance timer (4 seconds) - this will go to language selection
    autoAdvanceTimer.current = setTimeout(() => {
      handleGetStarted();
    }, 4000);

    // Cleanup timer on unmount
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  const handleGetStarted = () => {
    // Clear auto-advance timer when user manually navigates
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }
    router.replace('/language');
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
        colors={['#87CEEB', '#FFE4B5', '#FF9800']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Circuit Pattern Overlay */}
      <View style={styles.circuitOverlay} />

      {/* Floating Activity Tracking Elements */}
      <Animated.View style={[styles.floatingElement, styles.chart1, { transform: [{ translateY: floatingChart1 }] }]}>
        <BarChart3 size={22} color="rgba(255, 152, 0, 0.6)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.chart2, { transform: [{ translateY: floatingChart2 }] }]}>
        <BarChart3 size={18} color="rgba(255, 152, 0, 0.4)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.trend1, { transform: [{ translateY: floatingTrend1 }] }]}>
        <TrendingUp size={20} color="rgba(245, 124, 0, 0.5)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.trend2, { transform: [{ translateY: floatingTrend2 }] }]}>
        <TrendingUp size={16} color="rgba(245, 124, 0, 0.3)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.leaf1, { transform: [{ translateY: floatingLeaf1 }] }]}>
        <Leaf size={20} color="rgba(76, 175, 80, 0.4)" />
      </Animated.View>
      <Animated.View style={[styles.floatingElement, styles.leaf2, { transform: [{ translateY: floatingLeaf2 }] }]}>
        <Leaf size={16} color="rgba(76, 175, 80, 0.3)" />
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
        {/* Hero Section - Activity Tracking */}
        <Animated.View 
          style={[
            styles.heroSection,
            { transform: [{ translateY: slideAnimation }] }
          ]}
        >
          <View style={styles.heroContainer}>
            {/* Activity Tracking Illustration */}
            <View style={styles.activityContainer}>
              <View style={styles.activityBackground}>
                <Activity size={60} color="#FF9800" />
                <Text style={styles.chartEmoji}>📈</Text>
              </View>
              <View style={styles.activityGlow} />
            </View>
            <Text style={styles.heroEmoji}>📊🌾</Text>
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
            <Sparkles size={16} color="#FF9800" />
            <Text style={styles.badgeText}>{t('intro.badge.tracking')}</Text>
          </View>
          
          {/* Gradient Title */}
          <LinearGradient
            colors={['#F57C00', '#FF9800', '#FFB74D']}
            style={styles.titleGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.title}>{t('intro.pages.page3.title')}</Text>
          </LinearGradient>
          
          <Text style={styles.subtitle}>{t('intro.pages.page3.subtitle')}</Text>
          <Text style={styles.description}>{t('intro.pages.page3.description')}</Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom Navigation */}
      <View style={styles.bottomContainer}>
        {/* Leaf Progress Indicators */}
        <View style={styles.pageIndicator}>
          <Leaf size={16} color="#E5E7EB" />
          <Leaf size={16} color="#E5E7EB" />
          <Leaf size={20} color="#FF9800" style={styles.activeLeaf} />
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.previousButton} onPress={handlePrevious}>
            <ChevronLeft size={24} color="#FF9800" />
            <Text style={styles.previousButtonText}>{t('intro.navigation.previous')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              style={styles.leafButtonGradient}
            >
              <BarChart3 size={20} color="#FFFFFF" />
              <Text style={styles.getStartedButtonText}>{t('intro.navigation.getStarted')}</Text>
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
  
  // Circuit Pattern Overlay
  circuitOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.1,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
    borderStyle: 'dashed',
  },

  // Floating Elements
  floatingElement: {
    position: 'absolute',
    zIndex: 1,
  },
  chart1: {
    top: '18%',
    left: '12%',
  },
  chart2: {
    top: '28%',
    right: '18%',
  },
  trend1: {
    top: '38%',
    left: '22%',
  },
  trend2: {
    top: '48%',
    right: '15%',
  },
  leaf1: {
    top: '58%',
    left: '15%',
  },
  leaf2: {
    top: '68%',
    right: '20%',
  },

  // Background Farming Illustrations
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
    shadowColor: '#FF9800',
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
    color: '#F57C00',
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
  activityContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  activityBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  chartEmoji: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    fontSize: 24,
  },
  activityGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FF9800',
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
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F57C00',
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
    backgroundColor: '#FF9800',
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
    color: '#FF9800',
  },
  getStartedButton: {
    borderRadius: 25,
    shadowColor: '#FF9800',
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
    minWidth: 180,
    justifyContent: 'center',
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
