import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  Modal,
  Animated,
  
  Alert,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Bell, 
  BellOff,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  BarChart3,
  Target,
  Filter,
  X,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { alertSystem, PriceAlert, Notification, DailySummary } from '../src/utils/alertSystem';
import { pinnedItemsManager } from '../src/utils/pinnedItems';

export default function AlertsNotificationsScreen() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'notifications' | 'summary'>('notifications');
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<PriceAlert | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'high_priority'>('all');
  
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadData();
    
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

    // Subscribe to notification updates
    const unsubscribe = alertSystem.addListener((newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, []);

  const loadData = async () => {
    try {
      setAlerts(alertSystem.getPriceAlerts());
      setNotifications(alertSystem.getNotifications());
      setDailySummary(alertSystem.getLatestDailySummary());
    } catch (error) {
      console.error('Error loading alerts data:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle size={16} color="#EF4444" />;
      case 'high': return <AlertCircle size={16} color="#F59E0B" />;
      case 'medium': return <Bell size={16} color="#3B82F6" />;
      case 'low': return <Bell size={16} color="#6B7280" />;
      default: return <Bell size={16} color="#6B7280" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp size={16} color="#22C55E" />;
      case 'falling': return <TrendingDown size={16} color="#EF4444" />;
      default: return <Target size={16} color="#6B7280" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return '#22C55E';
      case 'sell': return '#EF4444';
      case 'watch': return '#F59E0B';
      case 'hold': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const toggleAlert = async (alertId: string) => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        await alertSystem.updatePriceAlert(alertId, { isActive: !alert.isActive });
        loadData();
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const deleteAlert = async (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this price alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await alertSystem.deletePriceAlert(alertId);
              loadData();
            } catch (error) {
              console.error('Error deleting alert:', error);
            }
          }
        }
      ]
    );
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await alertSystem.markNotificationAsRead(notificationId);
      loadData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const generateDailySummary = async () => {
    try {
      const summary = await alertSystem.generateDailySummary();
      setDailySummary(summary);
      Alert.alert('Success', 'Daily summary generated successfully!');
    } catch (error) {
      console.error('Error generating daily summary:', error);
      Alert.alert('Error', 'Failed to generate daily summary. Please try again.');
    }
  };

  const renderAlertCard = (alert: PriceAlert) => (
    <Animated.View
      key={alert.id}
      style={[
        styles.alertCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <LinearGradient
        colors={alert.isActive ? ['#FFFFFF', '#F8FAFC'] : ['#F9FAFB', '#F3F4F6']}
        style={styles.alertCardGradient}
      >
        <View style={styles.alertHeader}>
          <View style={styles.alertInfo}>
            <Text style={styles.commodityName}>{alert.commodity}</Text>
            <Text style={styles.locationText}>{alert.location}</Text>
          </View>
          <View style={styles.alertActions}>
            <View style={styles.priorityBadge}>
              {getPriorityIcon(alert.priority)}
              <Text style={[
                styles.priorityText,
                { color: getPriorityColor(alert.priority) }
              ]}>
                {alert.priority.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => toggleAlert(alert.id)}
            >
              {alert.isActive ? (
                <Eye size={16} color="#22C55E" />
              ) : (
                <EyeOff size={16} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.alertDetails}>
          <View style={styles.priceSection}>
            <Text style={styles.currentPriceLabel}>Current Price</Text>
            <Text style={styles.currentPriceValue}>{formatPrice(alert.currentPrice)}</Text>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.targetPriceLabel}>Target Price</Text>
            <Text style={styles.targetPriceValue}>{formatPrice(alert.targetPrice)}</Text>
          </View>
          <View style={styles.priceSection}>
            <Text style={styles.conditionLabel}>Condition</Text>
            <Text style={styles.conditionValue}>
              {alert.condition === 'above' ? 'Above' : 
               alert.condition === 'below' ? 'Below' : 
               `${alert.changePercent}% Change`}
            </Text>
          </View>
        </View>

        <View style={styles.alertFooter}>
          <View style={styles.alertStats}>
            <Clock size={12} color="#6B7280" />
            <Text style={styles.alertStatsText}>
              Created {formatDate(alert.createdAt)}
            </Text>
          </View>
          <View style={styles.alertStats}>
            <Bell size={12} color="#6B7280" />
            <Text style={styles.alertStatsText}>
              Triggered {alert.triggerCount} times
            </Text>
          </View>
        </View>

        <View style={styles.alertActions}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setSelectedAlert(alert)}
          >
            <Edit3 size={16} color="#3B82F6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => deleteAlert(alert.id)}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderNotificationCard = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        !notification.isRead && styles.unreadNotification
      ]}
      onPress={() => markNotificationAsRead(notification.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          {getPriorityIcon(notification.priority)}
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationTime}>
            {formatDate(notification.timestamp)}
          </Text>
        </View>
        {!notification.isRead && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.notificationMessage}>{notification.message}</Text>
      {notification.category && (
        <View style={styles.notificationCategory}>
          <Text style={styles.categoryText}>{notification.category}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderDailySummary = () => {
    if (!dailySummary) {
      return (
        <View style={styles.emptyState}>
          <BarChart3 size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Daily Summary</Text>
          <Text style={styles.emptySubtitle}>
            Generate a daily summary to see top commodities with highest profit potential
          </Text>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={generateDailySummary}
          >
            <Text style={styles.generateButtonText}>Generate Summary</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView style={styles.summaryContent}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Daily Market Summary</Text>
          <Text style={styles.summaryDate}>{formatDate(dailySummary.date)}</Text>
        </View>

        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Market Insights</Text>
          <View style={styles.insightsGrid}>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Total Commodities</Text>
              <Text style={styles.insightValue}>{dailySummary.marketInsights.totalCommodities}</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Avg Price Change</Text>
              <Text style={styles.insightValue}>
                {dailySummary.marketInsights.averagePriceChange.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Market Trend</Text>
              <Text style={[
                styles.insightValue,
                { color: dailySummary.marketInsights.marketTrend === 'bullish' ? '#22C55E' : 
                         dailySummary.marketInsights.marketTrend === 'bearish' ? '#EF4444' : '#6B7280' }
              ]}>
                {dailySummary.marketInsights.marketTrend.toUpperCase()}
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Top Category</Text>
              <Text style={styles.insightValue}>{dailySummary.marketInsights.topPerformingCategory}</Text>
            </View>
          </View>
        </View>

        <View style={styles.topCommoditiesCard}>
          <Text style={styles.topCommoditiesTitle}>Top Commodities by Profit Potential</Text>
          {dailySummary.topCommodities.map((commodity, index) => (
            <View key={index} style={styles.commodityItem}>
              <View style={styles.commodityInfo}>
                <Text style={styles.commodityName}>{commodity.commodity}</Text>
                <Text style={styles.commodityLocation}>{commodity.location}</Text>
              </View>
              <View style={styles.commodityDetails}>
                <Text style={styles.commodityPrice}>{formatPrice(commodity.currentPrice)}</Text>
                <View style={styles.profitSection}>
                  <Text style={styles.profitLabel}>Profit Potential</Text>
                  <Text style={[
                    styles.profitValue,
                    { color: commodity.profitPercent > 5 ? '#22C55E' : '#6B7280' }
                  ]}>
                    {formatPrice(commodity.profitPotential)} ({commodity.profitPercent.toFixed(1)}%)
                  </Text>
                </View>
                <View style={styles.recommendationSection}>
                  <View style={styles.trendRow}>
                    {getTrendIcon(commodity.trend)}
                    <Text style={styles.trendText}>{commodity.trend}</Text>
                  </View>
                  <Text style={[
                    styles.recommendationText,
                    { color: getRecommendationColor(commodity.recommendation) }
                  ]}>
                    {commodity.recommendation.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'alerts':
        return (
          <ScrollView style={styles.tabContent}>
            {alerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Price Alerts</Text>
                <Text style={styles.emptySubtitle}>
                  Create price alerts to get notified when commodity prices reach your target levels
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => setShowCreateAlert(true)}
                >
                  <Text style={styles.createButtonText}>Create Alert</Text>
                </TouchableOpacity>
              </View>
            ) : (
              alerts.map(renderAlertCard)
            )}
          </ScrollView>
        );
      case 'notifications':
        const filteredNotifications = notifications.filter(notif => {
          if (filterType === 'unread') return !notif.isRead;
          if (filterType === 'high_priority') return notif.priority === 'high' || notif.priority === 'critical';
          return true;
        });

        return (
          <ScrollView style={styles.tabContent}>
            {filteredNotifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Bell size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptySubtitle}>
                  You'll receive notifications when your price alerts are triggered
                </Text>
              </View>
            ) : (
              filteredNotifications.map(renderNotificationCard)
            )}
          </ScrollView>
        );
      case 'summary':
        return renderDailySummary();
      default:
        return null;
    }
  };

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
          <Text style={styles.headerTitle}>Alerts & Notifications</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Settings size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'notifications' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('notifications')}
          >
            <Bell size={16} color={activeTab === 'notifications' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'notifications' && styles.tabButtonTextActive
            ]}>
              Notifications
            </Text>
            {alertSystem.getUnreadNotificationCount() > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {alertSystem.getUnreadNotificationCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'alerts' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('alerts')}
          >
            <Target size={16} color={activeTab === 'alerts' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'alerts' && styles.tabButtonTextActive
            ]}>
              Alerts
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'summary' && styles.tabButtonActive
            ]}
            onPress={() => setActiveTab('summary')}
          >
            <BarChart3 size={16} color={activeTab === 'summary' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'summary' && styles.tabButtonTextActive
            ]}>
              Summary
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Bar for Notifications */}
        {activeTab === 'notifications' && (
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(['all', 'unread', 'high_priority'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    filterType === filter && styles.filterButtonActive
                  ]}
                  onPress={() => setFilterType(filter)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterType === filter && styles.filterButtonTextActive
                  ]}>
                    {filter === 'all' ? 'All' : 
                     filter === 'unread' ? 'Unread' : 'High Priority'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Tab Content */}
        {renderTabContent()}
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
    position: 'relative',
  },
  tabButtonActive: {
    backgroundColor: '#3B82F6',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  alertCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alertCardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alertInfo: {
    flex: 1,
  },
  commodityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  alertActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  priceSection: {
    alignItems: 'center',
  },
  currentPriceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  currentPriceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  targetPriceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  targetPriceValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  conditionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  conditionValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  alertStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertStatsText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E5E7EB',
  },
  unreadNotification: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#3B82F6',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationCategory: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summaryContent: {
    flex: 1,
    padding: 20,
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 16,
    color: '#6B7280',
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  insightItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  topCommoditiesCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topCommoditiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  commodityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  commodityInfo: {
    flex: 1,
  },
  commodityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  commodityLocation: {
    fontSize: 12,
    color: '#6B7280',
  },
  commodityDetails: {
    alignItems: 'flex-end',
  },
  commodityPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profitSection: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  profitLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  profitValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#6B7280',
  },
  recommendationText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  generateButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
