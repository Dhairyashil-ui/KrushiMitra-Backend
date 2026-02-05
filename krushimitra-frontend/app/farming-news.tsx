import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Platform,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Newspaper,
  Volume2,
  Calendar,
  MapPin,
  TrendingUp,
  IndianRupee,
  Users,
  Cloud,
  Leaf,
  Play,
  Pause,
  Sparkles,
  Star,
  Bot,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface NewsItem {
  id: string;
  headline: string;
  category: 'national' | 'market' | 'policy' | 'climate' | 'success';
  date: string;
  source: string;
  content: string;
  image?: string;
  isPlaying: boolean;
  isFeatured?: boolean;
}

export default function FarmingNewsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'national' | 'market' | 'policy' | 'climate' | 'success'>('all');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [topNews, setTopNews] = useState<NewsItem | null>(null);
  const [demoText, setDemoText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(30)).current;
  const typingAnimation = useRef(new Animated.Value(0)).current;

  // Mock news data
  const mockNewsData: NewsItem[] = [
    {
      id: '1',
      headline: 'ICAR announces new high-yield paddy variety',
      category: 'national',
      date: '2024-01-15',
      source: 'National Agriculture News',
      content: 'The Indian Council of Agricultural Research has developed a new paddy variety that yields 25% more than traditional varieties while being resistant to common pests.',
      isPlaying: false,
      isFeatured: true,
    },
    {
      id: '2',
      headline: 'India to export more onions this season',
      category: 'market',
      date: '2024-01-14',
      source: 'Agricultural Trade Report',
      content: 'With a bumper harvest expected, India is planning to increase onion exports by 40% this season, targeting markets in Southeast Asia and the Middle East.',
      isPlaying: false,
    },
    {
      id: '3',
      headline: 'Government approves ₹500 crore package for irrigation in Kerala',
      category: 'policy',
      date: '2024-01-13',
      source: 'State Government Press Release',
      content: 'The Kerala state government has approved a ₹500 crore package to improve irrigation infrastructure in drought-prone areas, benefiting over 50,000 farmers.',
      isPlaying: false,
      isFeatured: true,
    },
    {
      id: '4',
      headline: 'IMD predicts weak monsoon this year',
      category: 'climate',
      date: '2024-01-12',
      source: 'India Meteorological Department',
      content: 'The India Meteorological Department forecasts a weaker-than-average monsoon this year, urging farmers to consider drought-resistant crop varieties.',
      isPlaying: false,
    },
    {
      id: '5',
      headline: 'Kerala farmer doubles income with aquaponics',
      category: 'success',
      date: '2024-01-11',
      source: 'Farmer Success Stories',
      content: 'A farmer in Kerala has doubled his income by implementing aquaponics techniques, combining fish farming with vegetable cultivation in a sustainable system.',
      isPlaying: false,
      isFeatured: true,
    },
    {
      id: '6',
      headline: 'Maharashtra bans export of sugarcane temporarily',
      category: 'market',
      date: '2024-01-10',
      source: 'State Agricultural Department',
      content: 'The Maharashtra government has temporarily banned the export of sugarcane to ensure domestic supply meets local demand during the peak season.',
      isPlaying: false,
    },
    {
      id: '7',
      headline: 'New MSP for Rabi crops announced',
      category: 'policy',
      date: '2024-01-09',
      source: 'Ministry of Agriculture',
      content: 'The government has announced increased Minimum Support Prices for Rabi crops, providing better returns to farmers during the upcoming season.',
      isPlaying: false,
    },
    {
      id: '8',
      headline: 'Global demand for turmeric is rising',
      category: 'market',
      date: '2024-01-08',
      source: 'International Trade Report',
      content: 'International demand for Indian turmeric has surged by 35% this year, creating new export opportunities for spice farmers.',
      isPlaying: false,
    },
  ];

  const typingText = "Based on current market trends, I recommend paying attention to the onion export news. With a 40% increase expected, this could significantly impact local prices. Also, the new paddy variety announcement from ICAR could benefit your crop planning for the upcoming season.";

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Load mock news data
    setNewsItems(mockNewsData);
    
    // Set top news (featured items)
    const featuredNews = mockNewsData.filter(item => item.isFeatured);
    if (featuredNews.length > 0) {
      // Select a random featured news item as top news
      const randomIndex = Math.floor(Math.random() * featuredNews.length);
      setTopNews(featuredNews[randomIndex]);
    }
  }, []);

  useEffect(() => {
    if (showDemo) {
      startDemo();
    }
  }, [showDemo]);

  // Start the demo animation and speech
  const startDemo = () => {
    // Reset states
    setDemoText('');
    setIsSpeaking(true);
    
    // Start typing animation
    typingAnimation.setValue(0);
    
    Animated.timing(typingAnimation, {
      toValue: typingText.length,
      duration: typingText.length * 50, // Adjust speed as needed
      useNativeDriver: false,
    }).start(() => {
      // Animation completed
      setIsSpeaking(false);
    });
  };

  // Subscribe to animation updates
  useEffect(() => {
    const listenerId = typingAnimation.addListener(({ value }) => {
      const currentIndex = Math.floor(value);
      const newText = typingText.substring(0, currentIndex);
      setDemoText(newText);
    });
    
    return () => {
      typingAnimation.removeListener(listenerId);
    };
  }, []);

  const handleBack = () => {
    router.back();
  };

  const speakNews = (item: NewsItem) => {
    if (playingItemId === item.id) {
      // Stop speaking - NO device TTS to stop since user requested ONLY Niraj Hindi voice
      console.log('Stopping news TTS - ONLY Niraj Hindi voice from 11labs');
      setPlayingItemId(null);
      setNewsItems(prevItems =>
        prevItems.map(news =>
          news.id === item.id ? { ...news, isPlaying: false } : news
        )
      );
    } else {
      // Stop any currently playing news - NO device TTS to stop since user requested ONLY Niraj Hindi voice
      if (playingItemId) {
        console.log('Stopping previous news TTS - ONLY Niraj Hindi voice from 11labs');
        setNewsItems(prevItems =>
          prevItems.map(news =>
            news.id === playingItemId ? { ...news, isPlaying: false } : news
          )
        );
      }

      // Start speaking the new item
      setPlayingItemId(item.id);
      setNewsItems(prevItems =>
        prevItems.map(news =>
          news.id === item.id ? { ...news, isPlaying: true } : news
        )
      );

      console.log('News TTS - using ONLY Niraj Hindi voice from 11labs');
      // ONLY use 11labs Niraj Hindi voice - NO device TTS fallbacks
      // User explicitly requested ONLY Niraj Hindi voice
      
      setPlayingItemId(item.id);
      setNewsItems(prevItems =>
        prevItems.map(news =>
          news.id === item.id ? { ...news, isPlaying: true } : news
        )
      );

      // NO device TTS - would need to integrate with backend TTS endpoint for Niraj voice
      // For now, just mark as not playing after a delay
      setTimeout(() => {
        setPlayingItemId(null);
        setNewsItems(prevItems =>
          prevItems.map(news =>
            news.id === item.id ? { ...news, isPlaying: false } : news
          )
        );
      }, 3000); // Simulate playback duration
    }
  };

  const getFilteredNews = () => {
    if (activeTab === 'all') {
      return newsItems;
    }
    return newsItems.filter(item => item.category === activeTab);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'national':
        return <MapPin size={16} color="#4CAF50" />;
      case 'market':
        return <IndianRupee size={16} color="#4CAF50" />;
      case 'policy':
        return <Users size={16} color="#4CAF50" />;
      case 'climate':
        return <Cloud size={16} color="#4CAF50" />;
      case 'success':
        return <Leaf size={16} color="#4CAF50" />;
      default:
        return <Newspaper size={16} color="#4CAF50" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'national':
        return '#2196F3';
      case 'market':
        return '#FF9800';
      case 'policy':
        return '#9C27B0';
      case 'climate':
        return '#00BCD4';
      case 'success':
        return '#4CAF50';
      default:
        return '#6B7280';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'national':
        return 'National';
      case 'market':
        return 'Market';
      case 'policy':
        return 'Policy';
      case 'climate':
        return 'Climate';
      case 'success':
        return 'Success';
      default:
        return 'News';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F1F8E9', '#E8F5E8']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.3 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#4CAF50" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Farming News</Text>
            <Text style={styles.headerSubtitle}>
              Stay updated with the latest agricultural news
            </Text>
          </View>
        </View>

        {/* AI Demo Section */}
        {showDemo && (
          <View style={styles.aiSection}>
            <View style={styles.sectionHeader}>
              <Bot size={20} color="#2E7D32" />
              <Text style={styles.sectionTitle}>KrushiAI Assistant</Text>
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

        {/* Category Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { id: 'all', label: 'All', icon: Newspaper },
              { id: 'national', label: 'National', icon: MapPin },
              { id: 'market', label: 'Market', icon: IndianRupee },
              { id: 'policy', label: 'Policy', icon: Users },
              { id: 'climate', label: 'Climate', icon: Cloud },
              { id: 'success', label: 'Success', icon: Leaf },
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab,
                  tab.id === 'all' && activeTab === 'all' && styles.allTabActive,
                ]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <tab.icon
                  size={16}
                  color={activeTab === tab.id ? '#4CAF50' : '#9CA3AF'}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.id && styles.activeTabText,
                    tab.id === 'all' && activeTab === 'all' && styles.allTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* AI Top News Section */}
          {activeTab === 'all' && topNews && (
            <Animated.View
              style={[
                styles.topNewsContainer,
                {
                  opacity: fadeAnimation,
                  transform: [{ translateY: slideAnimation }],
                },
              ]}
            >
              <LinearGradient
                colors={['#E8F5E8', '#C8E6C9']}
                style={styles.topNewsGradient}
              >
                <View style={styles.topNewsHeader}>
                  <View style={styles.aiHeader}>
                    <Sparkles size={20} color="#4CAF50" />
                    <Text style={styles.aiHeaderText}>AI Top News</Text>
                  </View>
                  <View style={styles.topNewsBadge}>
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.topNewsBadgeText}>Featured</Text>
                  </View>
                </View>
                
                <Text style={styles.topNewsHeadline}>{topNews.headline}</Text>
                
                <View style={styles.topNewsMetadata}>
                  <View style={styles.metadataItem}>
                    <Calendar size={14} color="#2E7D32" />
                    <Text style={styles.topNewsMetadataText}>{topNews.date}</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <Newspaper size={14} color="#2E7D32" />
                    <Text style={styles.topNewsMetadataText}>{topNews.source}</Text>
                  </View>
                </View>
                
                <Text style={styles.topNewsContent} numberOfLines={3}>
                  {topNews.content}
                </Text>
                
                <TouchableOpacity
                  style={styles.topNewsPlayButton}
                  onPress={() => speakNews(topNews)}
                >
                  {topNews.isPlaying ? (
                    <Pause size={20} color="#FFFFFF" />
                  ) : (
                    <Play size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.topNewsPlayButtonText}>
                    {topNews.isPlaying ? 'Pause' : 'Listen'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}

          {/* News Feed */}
          <Animated.View
            style={[
              styles.newsContainer,
              {
                opacity: fadeAnimation,
                transform: [{ translateY: slideAnimation }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>
              {activeTab === 'all' ? 'Latest News' : `${getCategoryName(activeTab)} News`}
            </Text>
            
            {getFilteredNews().map((item, index) => (
              <Animated.View
                key={item.id}
                style={[
                  styles.newsCard,
                  {
                    opacity: fadeAnimation,
                    transform: [
                      {
                        translateY: slideAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [index * 20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.newsCardGradient}
                >
                  <View style={styles.newsHeader}>
                    <View style={styles.categoryTag}>
                      <View
                        style={[
                          styles.categoryIconContainer,
                          { backgroundColor: getCategoryColor(item.category) },
                        ]}
                      >
                        {getCategoryIcon(item.category)}
                      </View>
                      <Text style={styles.categoryText}>
                        {getCategoryName(item.category)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={() => speakNews(item)}
                    >
                      {item.isPlaying ? (
                        <Pause size={20} color="#4CAF50" />
                      ) : (
                        <Play size={20} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.headline}>{item.headline}</Text>

                  <View style={styles.metadata}>
                    <View style={styles.metadataItem}>
                      <Calendar size={14} color="#757575" />
                      <Text style={styles.metadataText}>{item.date}</Text>
                    </View>
                    <View style={styles.metadataItem}>
                      <Newspaper size={14} color="#757575" />
                      <Text style={styles.metadataText}>{item.source}</Text>
                    </View>
                  </View>

                  <Text style={styles.content} numberOfLines={3}>
                    {item.content}
                  </Text>
                </LinearGradient>
              </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ... existing styles ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  aiSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  demoCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  demoGradient: {
    padding: 20,
    borderRadius: 16,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoInfo: {
    flex: 1,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  demoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  demoText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    flex: 1,
  },
  cursorContainer: {
    width: 2,
    height: 20,
    backgroundColor: '#2E7D32',
    marginLeft: 2,
    marginTop: 2,
  },
  cursor: {
    color: '#2E7D32',
  },
  closeDemoButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeDemoText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#E8F5E8',
  },
  allTabActive: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  allTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topNewsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  topNewsGradient: {
    padding: 20,
  },
  topNewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  topNewsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  topNewsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  topNewsHeadline: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  topNewsMetadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  topNewsMetadataText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  topNewsContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  topNewsPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  topNewsPlayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  newsContainer: {
    gap: 16,
  },
  newsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  newsCardGradient: {
    padding: 16,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#757575',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  content: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});