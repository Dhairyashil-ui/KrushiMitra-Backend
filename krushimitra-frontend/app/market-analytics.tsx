import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Dimensions,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  MapPin,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Share
} from 'lucide-react-native';

interface MarketTrend {
  commodity: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  trend: 'rising' | 'falling' | 'stable';
  volume: number;
  marketCap: number;
}

interface CategoryAnalytics {
  category: string;
  totalCommodities: number;
  averagePrice: number;
  priceChange: number;
  marketShare: number;
  topPerformer: string;
  worstPerformer: string;
}

interface LocationAnalytics {
  location: string;
  totalCommodities: number;
  averagePrice: number;
  priceChange: number;
  volume: number;
  growth: number;
}

const MOCK_MARKET_TRENDS: MarketTrend[] = [
  {
    commodity: 'Tomato',
    currentPrice: 45,
    previousPrice: 42,
    change: 3,
    changePercent: 7.1,
    trend: 'rising',
    volume: 1250,
    marketCap: 56250
  },
  {
    commodity: 'Rice',
    currentPrice: 2800,
    previousPrice: 2850,
    change: -50,
    changePercent: -1.8,
    trend: 'falling',
    volume: 850,
    marketCap: 2380000
  },
  {
    commodity: 'Wheat',
    currentPrice: 2400,
    previousPrice: 2400,
    change: 0,
    changePercent: 0,
    trend: 'stable',
    volume: 920,
    marketCap: 2208000
  },
  {
    commodity: 'Onion',
    currentPrice: 35,
    previousPrice: 38,
    change: -3,
    changePercent: -7.9,
    trend: 'falling',
    volume: 680,
    marketCap: 23800
  },
  {
    commodity: 'Potato',
    currentPrice: 25,
    previousPrice: 22,
    change: 3,
    changePercent: 13.6,
    trend: 'rising',
    volume: 1100,
    marketCap: 27500
  }
];

const MOCK_CATEGORY_ANALYTICS: CategoryAnalytics[] = [
  {
    category: 'Vegetables',
    totalCommodities: 8,
    averagePrice: 32,
    priceChange: 2.5,
    marketShare: 35,
    topPerformer: 'Tomato',
    worstPerformer: 'Onion'
  },
  {
    category: 'Cereals',
    totalCommodities: 6,
    averagePrice: 2600,
    priceChange: -0.8,
    marketShare: 45,
    topPerformer: 'Wheat',
    worstPerformer: 'Rice'
  },
  {
    category: 'Fruits',
    totalCommodities: 5,
    averagePrice: 78,
    priceChange: 4.2,
    marketShare: 20,
    topPerformer: 'Mango',
    worstPerformer: 'Apple'
  }
];

const MOCK_LOCATION_ANALYTICS: LocationAnalytics[] = [
  {
    location: 'Kochi',
    totalCommodities: 12,
    averagePrice: 1250,
    priceChange: 3.2,
    volume: 2850,
    growth: 8.5
  },
  {
    location: 'Thiruvananthapuram',
    totalCommodities: 10,
    averagePrice: 1180,
    priceChange: 1.8,
    volume: 2200,
    growth: 5.2
  },
  {
    location: 'Kozhikode',
    totalCommodities: 8,
    averagePrice: 1320,
    priceChange: 4.1,
    volume: 1950,
    growth: 12.3
  }
];

export default function MarketAnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'1D' | '7D' | '1M' | '3M'>('7D');
  const [selectedView, setSelectedView] = useState<'trends' | 'categories' | 'locations'>('trends');
  const [refreshing, setRefreshing] = useState(false);
  
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return '#22C55E';
    if (change < 0) return '#EF4444';
    return '#6B7280';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight size={16} color="#22C55E" />;
    if (change < 0) return <ArrowDownRight size={16} color="#EF4444" />;
    return null;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp size={20} color="#22C55E" />;
      case 'falling':
        return <TrendingDown size={20} color="#EF4444" />;
      default:
        return <Activity size={20} color="#6B7280" />;
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderTrendCard = (trend: MarketTrend) => (
    <Animated.View
      key={trend.commodity}
      style={[
        styles.trendCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.trendCardGradient}
      >
        <View style={styles.trendHeader}>
          <View style={styles.commodityInfo}>
            <Text style={styles.commodityName}>{trend.commodity}</Text>
            <Text style={styles.currentPrice}>{formatPrice(trend.currentPrice)}</Text>
          </View>
          <View style={styles.trendIcon}>
            {getTrendIcon(trend.trend)}
          </View>
        </View>

        <View style={styles.trendDetails}>
          <View style={styles.priceChangeSection}>
            <View style={styles.changeRow}>
              {getChangeIcon(trend.change)}
              <Text style={[
                styles.changeText,
                { color: getChangeColor(trend.change) }
              ]}>
                {trend.change > 0 ? '+' : ''}{formatPrice(Math.abs(trend.change))}
              </Text>
            </View>
            <Text style={[
              styles.changePercent,
              { color: getChangeColor(trend.change) }
            ]}>
              {trend.change > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.volumeSection}>
            <Text style={styles.volumeLabel}>Volume</Text>
            <Text style={styles.volumeValue}>{trend.volume.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.trendFooter}>
          <Text style={styles.previousPrice}>
            Previous: {formatPrice(trend.previousPrice)}
          </Text>
          <Text style={styles.marketCap}>
            Market Cap: {formatPrice(trend.marketCap)}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderCategoryCard = (category: CategoryAnalytics) => (
    <Animated.View
      key={category.category}
      style={[
        styles.categoryCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.categoryCardGradient}
      >
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryName}>{category.category}</Text>
          <View style={styles.marketShareBadge}>
            <Text style={styles.marketShareText}>{category.marketShare}%</Text>
          </View>
        </View>

        <View style={styles.categoryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Commodities</Text>
            <Text style={styles.statValue}>{category.totalCommodities}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg Price</Text>
            <Text style={styles.statValue}>{formatPrice(category.averagePrice)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Change</Text>
            <Text style={[
              styles.statValue,
              { color: getChangeColor(category.priceChange) }
            ]}>
              {category.priceChange > 0 ? '+' : ''}{category.priceChange.toFixed(1)}%
            </Text>
          </View>
        </View>

        <View style={styles.performanceSection}>
          <View style={styles.performerItem}>
            <Text style={styles.performerLabel}>Top Performer</Text>
            <Text style={styles.performerValue}>{category.topPerformer}</Text>
          </View>
          <View style={styles.performerItem}>
            <Text style={styles.performerLabel}>Worst Performer</Text>
            <Text style={styles.performerValue}>{category.worstPerformer}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderLocationCard = (location: LocationAnalytics) => (
    <Animated.View
      key={location.location}
      style={[
        styles.locationCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.locationCardGradient}
      >
        <View style={styles.locationHeader}>
          <View style={styles.locationInfo}>
            <MapPin size={16} color="#6B7280" />
            <Text style={styles.locationName}>{location.location}</Text>
          </View>
          <View style={styles.growthBadge}>
            <Text style={styles.growthText}>+{location.growth.toFixed(1)}%</Text>
          </View>
        </View>

        <View style={styles.locationStats}>
          <View style={styles.locationStatItem}>
            <Text style={styles.locationStatLabel}>Commodities</Text>
            <Text style={styles.locationStatValue}>{location.totalCommodities}</Text>
          </View>
          <View style={styles.locationStatItem}>
            <Text style={styles.locationStatLabel}>Avg Price</Text>
            <Text style={styles.locationStatValue}>{formatPrice(location.averagePrice)}</Text>
          </View>
          <View style={styles.locationStatItem}>
            <Text style={styles.locationStatLabel}>Volume</Text>
            <Text style={styles.locationStatValue}>{location.volume.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.locationChange}>
          <Text style={styles.locationChangeLabel}>Price Change</Text>
          <Text style={[
            styles.locationChangeValue,
            { color: getChangeColor(location.priceChange) }
          ]}>
            {location.priceChange > 0 ? '+' : ''}{location.priceChange.toFixed(1)}%
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Market Analytics</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Download size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Share size={20} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={refreshData}
            >
              <RefreshCw size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['1D', '7D', '1M', '3M'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* View Selector */}
        <View style={styles.viewSelector}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              selectedView === 'trends' && styles.viewButtonActive
            ]}
            onPress={() => setSelectedView('trends')}
          >
            <BarChart3 size={16} color={selectedView === 'trends' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[
              styles.viewButtonText,
              selectedView === 'trends' && styles.viewButtonTextActive
            ]}>
              Trends
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              selectedView === 'categories' && styles.viewButtonActive
            ]}
            onPress={() => setSelectedView('categories')}
          >
            <PieChart size={16} color={selectedView === 'categories' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[
              styles.viewButtonText,
              selectedView === 'categories' && styles.viewButtonTextActive
            ]}>
              Categories
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewButton,
              selectedView === 'locations' && styles.viewButtonActive
            ]}
            onPress={() => setSelectedView('locations')}
          >
            <MapPin size={16} color={selectedView === 'locations' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[
              styles.viewButtonText,
              selectedView === 'locations' && styles.viewButtonTextActive
            ]}>
              Locations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.contentList} showsVerticalScrollIndicator={false}>
          {selectedView === 'trends' && (
            <View style={styles.trendsList}>
              {MOCK_MARKET_TRENDS.map(renderTrendCard)}
            </View>
          )}

          {selectedView === 'categories' && (
            <View style={styles.categoriesList}>
              {MOCK_CATEGORY_ANALYTICS.map(renderCategoryCard)}
            </View>
          )}

          {selectedView === 'locations' && (
            <View style={styles.locationsList}>
              {MOCK_LOCATION_ANALYTICS.map(renderLocationCard)}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#3B82F6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  viewSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  viewButtonActive: {
    backgroundColor: '#3B82F6',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  viewButtonTextActive: {
    color: '#FFFFFF',
  },
  contentList: {
    flex: 1,
  },
  trendsList: {
    padding: 20,
  },
  trendCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trendCardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commodityInfo: {
    flex: 1,
  },
  commodityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  trendIcon: {
    marginLeft: 12,
  },
  trendDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceChangeSection: {
    flex: 1,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  changeText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
  },
  changePercent: {
    fontSize: 14,
    fontWeight: '500',
  },
  volumeSection: {
    alignItems: 'flex-end',
  },
  volumeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  volumeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  trendFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previousPrice: {
    fontSize: 12,
    color: '#6B7280',
  },
  marketCap: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoriesList: {
    padding: 20,
  },
  categoryCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryCardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  marketShareBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  marketShareText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  performanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performerItem: {
    alignItems: 'center',
  },
  performerLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  performerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationsList: {
    padding: 20,
  },
  locationCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationCardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationName: {
    marginLeft: 6,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  growthBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  growthText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
  },
  locationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  locationStatItem: {
    alignItems: 'center',
  },
  locationStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  locationChange: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationChangeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  locationChangeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
