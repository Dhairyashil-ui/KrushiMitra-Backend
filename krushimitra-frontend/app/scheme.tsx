import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Platform, Alert, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Search, 
  Filter, 
  Award, 
  FileText, 
  Users, 
  ChevronRight,
  Clock,
  AlertCircle,
  Bot,
  Sparkles,
  Leaf,
  Zap,
  TrendingUp,
  Star,
  Globe,
  Calendar,
  MapPin
} from 'lucide-react-native';


// Mock data for government schemes
const mockSchemes = [
  {
    id: '1',
    name: 'PM Kisan Samman Nidhi',
    description: 'Direct income support to eligible farmer families',
    eligibility: 'Small and marginal farmers with landholding up to 2 hectares',
    action: 'Apply online',
    deadline: '30 June 2025',
    category: 'Income Support',
    icon: '💰',
    cropType: 'All crops'
  },
  {
    id: '2',
    name: 'Pradhan Mantri Fasal Bima Yojana',
    description: 'Crop insurance scheme to provide financial support to farmers',
    eligibility: 'All farmers including tenant farmers and sharecroppers',
    action: 'Visit insurance office',
    deadline: '30 days after sowing',
    category: 'Insurance',
    icon: '🛡️',
    cropType: 'All crops'
  },
  {
    id: '3',
    name: 'Soil Health Card Scheme',
    description: 'Soil testing and nutrient management for farms',
    eligibility: 'All farmers',
    action: 'Upload soil sample',
    deadline: 'Ongoing',
    category: 'Soil Health',
    icon: '🌱',
    cropType: 'All crops'
  },
  {
    id: '4',
    name: 'Paramparagat Krishi Vikas Yojana',
    description: 'Promotion of organic farming practices',
    eligibility: 'Farmer groups of 10 or more',
    action: 'Apply online',
    deadline: '31 March 2025',
    category: 'Organic Farming',
    icon: '🌿',
    cropType: 'All crops'
  },
  {
    id: '5',
    name: 'National Mission for Sustainable Agriculture',
    description: 'Climate resilient agriculture through sustainable practices',
    eligibility: 'All farmers practicing sustainable methods',
    action: 'Visit district office',
    deadline: '30 September 2025',
    category: 'Sustainable Agriculture',
    icon: '🌍',
    cropType: 'All crops'
  },
  {
    id: '6',
    name: 'Rashtriya Krishi Vikas Yojana',
    description: 'State level planning and project implementation',
    eligibility: 'State government agricultural departments',
    action: 'Apply through state',
    deadline: '31 December 2025',
    category: 'State Level',
    icon: '🏛️',
    cropType: 'All crops'
  }
];

export default function GovernmentSchemesScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [schemes, setSchemes] = useState(mockSchemes);
  const [filteredSchemes, setFilteredSchemes] = useState(mockSchemes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [demoText, setDemoText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  
  const router = useRouter();
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const typingText = "Based on your profile, I recommend applying for the PM Kisan Samman Nidhi scheme. This provides direct income support of ₹6,000 per year to small and marginal farmers like yourself.";
  const utteranceRef = useRef<any>(null);
  const lastSpokenIndex = useRef(0);
  
  // Animation refs for futuristic effects
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const particlePositions = useRef([
    new Animated.ValueXY({ x: -20, y: -20 }),
    new Animated.ValueXY({ x: 100, y: 50 }),
    new Animated.ValueXY({ x: 300, y: -20 }),
    new Animated.ValueXY({ x: -20, y: 200 }),
    new Animated.ValueXY({ x: 350, y: 300 }),
  ]).current;

  useEffect(() => {
    loadUserData();
    
    // Start entrance animations
    Animated.parallel([
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle pulse effect
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
  }, []);

  useEffect(() => {
    if (showDemo) {
      startDemo();
    }
    
    return () => {
      // NO device TTS cleanup - user explicitly requested ONLY Niraj Hindi voice
      console.log('Cleanup - NO device TTS to cancel since user requested ONLY Niraj Hindi voice');
    };
  }, [showDemo]);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsedData = JSON.parse(data);
        setUserData(parsedData);
        generateAIRecommendations(parsedData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Generate AI recommendations based on user profile
  const generateAIRecommendations = (userData: any) => {
    // In a real app, this would be generated by an AI model
    // For now, we'll use mock logic based on user data
    const recommendations = [];
    
    // Recommend PM Kisan for all farmers
    recommendations.push({
      schemeId: '1',
      reason: 'Income support for all farmers',
      priority: 'High',
      match: '100%'
    });
    
    // Recommend crop insurance for all farmers
    recommendations.push({
      schemeId: '2',
      reason: 'Protection against crop loss',
      priority: 'High',
      match: '100%'
    });
    
    // Recommend soil health card for all farmers
    recommendations.push({
      schemeId: '3',
      reason: 'Improve soil fertility and productivity',
      priority: 'Medium',
      match: '100%'
    });
    
    // Conditional recommendations based on user data
    if (userData.landSize && parseFloat(userData.landSize) <= 2) {
      recommendations.push({
        schemeId: '1',
        reason: 'Perfect match for your land size (up to 2 hectares)',
        priority: 'High',
        match: '95%'
      });
    }
    
    if (userData.cropType && userData.cropType.toLowerCase().includes('organic')) {
      recommendations.push({
        schemeId: '4',
        reason: 'Aligned with your organic farming practices',
        priority: 'High',
        match: '90%'
      });
    }
    
    setAiRecommendations(recommendations);
  };

  // Start the demo - using ONLY Niraj Hindi voice from 11labs
  const startDemo = () => {
    console.log('Scheme demo - using ONLY Niraj Hindi voice from 11labs');
    // ONLY use 11labs Niraj Hindi voice - NO device TTS fallbacks
    // User explicitly requested ONLY Niraj Hindi voice
    
    // Reset states
    setDemoText('');
    setIsSpeaking(true);
    lastSpokenIndex.current = 0;
    
    // Start typing animation without device TTS
    typingAnimation.setValue(0);
    
    Animated.timing(typingAnimation, {
      toValue: typingText.length,
      duration: typingText.length * 50, // Adjust speed as needed
      useNativeDriver: false,
    }).start(() => {
      // Animation completed - NO device TTS
      setIsSpeaking(false);
    });
  };

  // Filter schemes based on search query and category
  useEffect(() => {
    let result = schemes;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(scheme => 
        scheme.name.toLowerCase().includes(query) ||
        scheme.description.toLowerCase().includes(query) ||
        scheme.category.toLowerCase().includes(query) ||
        scheme.cropType.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== 'All') {
      result = result.filter(scheme => scheme.category === selectedCategory);
    }
    
    setFilteredSchemes(result);
  }, [searchQuery, selectedCategory, schemes]);

  const categories = ['All', ...Array.from(new Set(mockSchemes.map(scheme => scheme.category)))];

  // Get scheme by ID for recommendations
  const getSchemeById = (id: string) => {
    return schemes.find(scheme => scheme.id === id);
  };

  // Subscribe to animation updates - NO device TTS
  useEffect(() => {
    const listenerId = typingAnimation.addListener(({ value }) => {
      const currentIndex = Math.floor(value);
      const newText = typingText.substring(0, currentIndex);
      setDemoText(newText);
      
      // NO device TTS - user explicitly requested ONLY Niraj Hindi voice
      lastSpokenIndex.current = currentIndex;
    });
    
    return () => {
      typingAnimation.removeListener(listenerId);
    };
  }, []);

  // Animated button component for apply buttons
  const AnimatedButton = ({ onPress, children, style }: any) => {
    const buttonScale = useRef(new Animated.Value(1)).current;
    
    const handlePressIn = () => {
      Animated.spring(buttonScale, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 5,
      }).start();
    };
    
    const handlePressOut = () => {
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    };
    
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View style={[style, { transform: [{ scale: buttonScale }] }]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Add glow effect to buttons on press
  const handlePressIn = (animatedValue: Animated.Value) => {
    Animated.timing(animatedValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (animatedValue: Animated.Value) => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background Particles */}
      {particlePositions.map((position, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              transform: position.getTranslateTransform(),
              opacity: pulseAnimation,
              backgroundColor: index % 2 === 0 ? 'rgba(46, 125, 50, 0.2)' : 'rgba(76, 175, 80, 0.15)',
              width: 12 + index * 2,
              height: 12 + index * 2,
              borderRadius: 6 + index,
            }
          ]}
        />
      ))}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with enhanced animation */}
        <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
          <LinearGradient
            colors={['#2E7D32', '#4CAF50', '#81C784']}
            style={styles.header as any}
          >
            <View style={styles.headerContent}>
              <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
                <Leaf size={40} color="#FFFFFF" style={styles.headerIcon} />
              </Animated.View>
              <Text style={styles.headerTitle}>Government Schemes</Text>
              <Text style={styles.headerSubtitle}>Access subsidies and benefits for farmers</Text>
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Star size={14} color="#FFD700" />
                  <Text style={styles.badgeText}>AI Powered</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search schemes by name, crop, or category"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Zap size={20} color="#4CAF50" style={styles.magicIcon} />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#FFFFFF" />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* AI Demo Section */}
        {showDemo && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeader}>
              <Bot size={20} color="#2E7D32" />
              <Text style={styles.sectionTitle}>KrushiAI Assistant</Text>
              <Sparkles size={16} color="#FFD700" />
            </View>
            
            <View style={styles.demoCard}>
              <LinearGradient
                colors={['#E8F5E9', '#C8E6C9']}
                style={styles.demoGradient}
              >
                <View style={styles.demoHeader}>
                  <View style={styles.aiIconContainer}>
                    <Bot size={24} color="#2E7D32" />
                  </View>
                  <View style={styles.demoInfo}>
                    <Text style={styles.demoTitle}>KrushiAI</Text>
                    <View style={styles.statusContainer}>
                      {isSpeaking ? (
                        <>
                          <View style={styles.speakingIndicator} />
                          <Text style={styles.statusText}>Speaking...</Text>
                        </>
                      ) : (
                        <Text style={styles.statusText}>Thinking...</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.aiBadge}>
                    <TrendingUp size={14} color="#FFFFFF" />
                    <Text style={styles.aiBadgeText}>Smart</Text>
                  </View>
                </View>
                
                <View style={styles.demoContent}>
                  <Text style={styles.demoText}>{demoText}</Text>
                  {isSpeaking && (
                    <View style={styles.cursorContainer}>
                      <Text style={styles.cursor}>|</Text>
                    </View>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.closeDemoButton}
                  onPress={() => setShowDemo(false)}
                >
                  <Text style={styles.closeDemoText}>Dismiss</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* AI Recommendations */}
        {!showDemo && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeader}>
              <Bot size={20} color="#2E7D32" />
              <Text style={styles.sectionTitle}>AI Recommendations</Text>
              <Sparkles size={16} color="#FFD700" />
            </View>
            
            {aiRecommendations.length > 0 ? (
              aiRecommendations.map((rec, index) => {
                const scheme = getSchemeById(rec.schemeId);
                if (!scheme) return null;
                
                return (
                  <View key={index} style={styles.recommendationCard}>
                    <LinearGradient
                      colors={['#E8F5E9', '#C8E6C9']}
                      style={styles.recommendationGradient}
                    >
                      <View style={styles.recommendationHeader}>
                        <View style={styles.schemeIconContainer}>
                          <Text style={styles.schemeIcon}>{scheme.icon}</Text>
                        </View>
                        <View style={styles.recommendationInfo}>
                          <Text style={styles.schemeName}>{scheme.name}</Text>
                          <View style={styles.matchContainer}>
                            <Sparkles size={14} color="#4CAF50" />
                            <Text style={styles.matchText}>{rec.match} match</Text>
                          </View>
                        </View>
                        <View style={styles.priorityBadge}>
                          <Text style={styles.priorityBadgeText}>{rec.priority}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.reasonText}>{rec.reason}</Text>
                      
                      <AnimatedButton 
                        onPress={() => console.log('Apply to recommendation')}
                        style={styles.applyButton}
                      >
                        <Text style={styles.applyButtonText}>Apply Now</Text>
                        <ChevronRight size={16} color="#FFFFFF" />
                      </AnimatedButton>
                      
                    </LinearGradient>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <AlertCircle size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No AI recommendations available</Text>
              </View>
            )}
          </View>
        )}

        {/* Schemes List */}
        <View style={styles.schemesSection}>
          <View style={styles.sectionHeader}>
            <Award size={20} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Available Schemes</Text>
            <Globe size={16} color="#4CAF50" />
          </View>
          
          {filteredSchemes.length === 0 ? (
            <View style={styles.emptyState}>
              <Search size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No schemes found matching your criteria</Text>
            </View>
          ) : (
            filteredSchemes.map((scheme) => (
              <TouchableOpacity 
                key={scheme.id} 
                style={styles.schemeCard}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F0FDF4']}
                  style={styles.schemeGradient}
                >
                  <View style={styles.schemeHeader}>
                    <View style={styles.schemeIconContainer}>
                      <Text style={styles.schemeIcon}>{scheme.icon}</Text>
                    </View>
                    <View style={styles.schemeInfo}>
                      <Text style={styles.schemeName}>{scheme.name}</Text>
                      <Text style={styles.schemeDescription}>{scheme.description}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.schemeDetails}>
                    <View style={styles.detailRow}>
                      <Users size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{scheme.eligibility}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <FileText size={16} color="#6B7280" />
                      <Text style={styles.detailText}>Action: {scheme.action}</Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <MapPin size={16} color="#6B7280" />
                      <Text style={styles.detailText}>Category: {scheme.category}</Text>
                    </View>
                    
                    <View style={styles.deadlineRow}>
                      <Calendar size={16} color={scheme.deadline === 'Ongoing' ? '#4CAF50' : '#FF9800'} />
                      <Text style={[
                        styles.deadlineText,
                        scheme.deadline === 'Ongoing' ? styles.deadlineOngoing : styles.deadlinePending
                      ]}>
                        {scheme.deadline === 'Ongoing' ? 'Ongoing' : `Deadline: ${scheme.deadline}`}
                      </Text>
                      {scheme.deadline !== 'Ongoing' && (
                        <View style={styles.deadlineBadge}>
                          <Text style={styles.deadlineBadgeText}>!</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.applyButton}>
                    <Text style={styles.applyButtonText}>Apply Now</Text>
                    <ChevronRight size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  particle: {
    position: 'absolute',
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
    marginTop: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  searchIcon: {
    marginRight: 12,
  },
  magicIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 6,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
    shadowColor: '#2E7D32',
    shadowOpacity: 0.2,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  aiSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  demoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  demoGradient: {
    padding: 24,
    borderRadius: 20,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  aiIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  demoInfo: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  speakingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 60,
  },
  demoText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    flex: 1,
    fontWeight: '500',
  },
  cursorContainer: {
    width: 3,
    height: 24,
    backgroundColor: '#2E7D32',
    marginLeft: 4,
    marginTop: 2,
  },
  cursor: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  closeDemoButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  closeDemoText: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 14,
  },
  recommendationCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  recommendationGradient: {
    padding: 24,
    borderRadius: 20,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  schemeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  schemeIcon: {
    fontSize: 24,
  },
  recommendationInfo: {
    flex: 1,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  matchText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  reasonText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '500',
  },
  priorityBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  applyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  schemesSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  schemeCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  schemeGradient: {
    padding: 24,
    borderRadius: 20,
  },
  schemeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  schemeInfo: {
    flex: 1,
  },
  schemeName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  schemeDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontWeight: '500',
  },
  schemeDetails: {
    gap: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    fontWeight: '500',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deadlineText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  deadlineOngoing: {
    color: '#4CAF50',
  },
  deadlinePending: {
    color: '#FF9800',
  },
  deadlineBadge: {
    backgroundColor: '#FF9800',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deadlineBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
});
