import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Leaf,
  Users,
  TrendingUp,
  Bot,
  Camera,
  DollarSign
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface IntroPage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string[];
  illustration: string;
}

export default function IntroScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;

  const introPages: IntroPage[] = [
    {
      id: 1,
      title: t('intro.pages.page1.title'),
      subtitle: t('intro.pages.page1.subtitle'),
      description: t('intro.pages.page1.description'),
      icon: <Bot size={60} color="#4CAF50" />,
      gradient: ['#E8F5E9', '#C8E6C9', '#A5D6A7'],
      illustration: "🤖"
    },
    {
      id: 2,
      title: t('intro.pages.page2.title'),
      subtitle: t('intro.pages.page2.subtitle'),
      description: t('intro.pages.page2.description'),
      icon: <Users size={60} color="#2196F3" />,
      gradient: ['#E3F2FD', '#BBDEFB', '#90CAF9'],
      illustration: "👥"
    },
    {
      id: 3,
      title: t('intro.pages.page3.title'),
      subtitle: t('intro.pages.page3.subtitle'),
      description: t('intro.pages.page3.description'),
      icon: <TrendingUp size={60} color="#FF9800" />,
      gradient: ['#FFF3E0', '#FFE0B2', '#FFCC80'],
      illustration: "💰"
    }
  ];

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
    ]).start();
  }, []);

  const handleNext = () => {
    if (currentPage < introPages.length - 1) {
      setCurrentPage(currentPage + 1);
      animatePageTransition();
    } else {
      handleGetStarted();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      animatePageTransition();
    }
  };

  const handleSkip = () => {
    router.replace('/language');
  };

  const handleGetStarted = () => {
    router.replace('/language');
  };

  const animatePageTransition = () => {
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderPage = (page: IntroPage, index: number) => {
    const isActive = index === currentPage;
    
    return (
      <Animated.View
        key={page.id}
        style={[
          styles.pageContainer,
          {
            opacity: isActive ? fadeAnimation : 0.3,
            transform: [{ scale: isActive ? scaleAnimation : 0.8 }],
          }
        ]}
      >
        <LinearGradient
          colors={page.gradient}
          style={styles.pageGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Illustration Section */}
          <View style={styles.illustrationContainer}>
            <View style={styles.iconContainer}>
              {page.icon}
            </View>
            <Text style={styles.illustration}>{page.illustration}</Text>
            
            {/* Floating particles */}
            <View style={[styles.particle, styles.particle1]} />
            <View style={[styles.particle, styles.particle2]} />
            <View style={[styles.particle, styles.particle3]} />
          </View>

          {/* Content Section */}
          <View style={styles.contentContainer}>
            <View style={styles.badgeContainer}>
              <Sparkles size={16} color="#4CAF50" />
              <Text style={styles.badgeText}>KrushiMitra 2.0</Text>
            </View>
            
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.subtitle}>{page.subtitle}</Text>
            <Text style={styles.description}>{page.description}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {introPages.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.paginationDot,
              index === currentPage && styles.paginationDotActive
            ]}
            onPress={() => setCurrentPage(index)}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>{t('intro.navigation.skip')}</Text>
      </TouchableOpacity>

      {/* Pages */}
      <View style={styles.pagesContainer}>
        {introPages.map((page, index) => renderPage(page, index))}
      </View>

      {/* Pagination */}
      {renderPagination()}

      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.previousButton,
            currentPage === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePrevious}
          disabled={currentPage === 0}
        >
          <ChevronLeft size={24} color={currentPage === 0 ? "#9CA3AF" : "#4CAF50"} />
          <Text style={[
            styles.navButtonText,
            currentPage === 0 && styles.navButtonTextDisabled
          ]}>
            {t('intro.navigation.previous')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <LinearGradient
            colors={['#4CAF50', '#2E7D32']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentPage === introPages.length - 1 ? t('intro.navigation.getStarted') : t('intro.navigation.next')}
            </Text>
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
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  pagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContainer: {
    position: 'absolute',
    width: width - 40,
    height: height * 0.7,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  pageGradient: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
    fontSize: 80,
    marginTop: 20,
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
  contentContainer: {
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4CAF50',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  paginationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  paginationDotActive: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    gap: 8,
  },
  previousButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  nextButton: {
    borderRadius: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
