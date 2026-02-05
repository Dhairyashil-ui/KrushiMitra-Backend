import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PagerView from 'react-native-pager-view';

const { width } = Dimensions.get('window');

const introSlides = [
  {
    id: 1,
    icon: '🤖',
    title: 'AI सहायक',
    description: 'कृत्रिम बुद्धिमत्ता द्वारा संचालित स्मार्ट खेती की सलाह प्राप्त करें',
  },
  {
    
    id: 2,
    icon: '🔍',
    title: 'फसल रोग पहचान',
    description: 'छवि पहचान के साथ रोगों और कीटों की जल्दी पहचान करें',
  },
  {
    id: 3,
    icon: '🌤️',
    title: 'मौसम अलर्ट',
    description: 'वास्तविक समय के मौसम अपडेट और पूर्वानुमान के साथ जानकारी रखें',
  },
  {
    id: 4,
    icon: '🌱',
    title: 'फसल देखभाल',
    description: 'फसल रोग की पहचान और उपचार पर विशेषज्ञ सलाह प्राप्त करें',
  },
  {
    id: 5,
    icon: '📊',
    title: 'गतिविधि ट्रैकर',
    description: 'अपनी खेती की गतिविधियों को ट्रैक करें और रिकॉर्ड बनाए रखें',
  },
];

export default function IntroScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const router = useRouter();

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenIntro', 'true');
    router.replace('/language');
  };

  const handleNext = async () => {
    if (currentPage < introSlides.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      await AsyncStorage.setItem('hasSeenIntro', 'true');
      router.replace('/language');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>छोड़ें</Text>
      </TouchableOpacity>

      <PagerView
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {introSlides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <Text style={styles.icon}>{slide.icon}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          {introSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentPage && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentPage === introSlides.length - 1 ? 'शुरू करें' : 'आगे'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: '#6B7280',
    fontSize: 16,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  icon: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#22C55E',
    width: 24,
  },
  nextButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});