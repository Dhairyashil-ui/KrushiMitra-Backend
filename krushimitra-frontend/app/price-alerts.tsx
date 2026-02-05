import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput,
  Switch,
  Modal,
  Animated,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Bell, 
  BellOff, 
  Plus, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  IndianRupee,
  X
} from 'lucide-react-native';

interface PriceAlert {
  id: string;
  commodity: string;
  location: string;
  targetPrice: number;
  condition: 'above' | 'below' | 'change';
  changePercent?: number;
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface AlertNotification {
  id: string;
  alertId: string;
  commodity: string;
  location: string;
  currentPrice: number;
  targetPrice: number;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'price_reached' | 'price_change' | 'market_update';
}

const MOCK_ALERTS: PriceAlert[] = [
  {
    id: '1',
    commodity: 'Tomato',
    location: 'Kochi',
    targetPrice: 50,
    condition: 'above',
    isActive: true,
    createdAt: '2024-01-10T10:00:00Z',
    lastTriggered: '2024-01-15T14:30:00Z',
    triggerCount: 3
  },
  {
    id: '2',
    commodity: 'Rice',
    location: 'Thiruvananthapuram',
    targetPrice: 3000,
    condition: 'below',
    isActive: true,
    createdAt: '2024-01-12T08:00:00Z',
    triggerCount: 1
  },
  {
    id: '3',
    commodity: 'Wheat',
    location: 'Kozhikode',
    targetPrice: 2500,
    condition: 'change',
    changePercent: 5,
    isActive: false,
    createdAt: '2024-01-08T15:30:00Z',
    triggerCount: 0
  }
];

const MOCK_NOTIFICATIONS: AlertNotification[] = [
  {
    id: '1',
    alertId: '1',
    commodity: 'Tomato',
    location: 'Kochi',
    currentPrice: 52,
    targetPrice: 50,
    message: 'Tomato price in Kochi has reached ₹52/kg, above your target of ₹50/kg',
    timestamp: '2024-01-15T14:30:00Z',
    isRead: false,
    type: 'price_reached'
  },
  {
    id: '2',
    alertId: '2',
    commodity: 'Rice',
    location: 'Thiruvananthapuram',
    currentPrice: 2850,
    targetPrice: 3000,
    message: 'Rice price in Thiruvananthapuram has dropped to ₹2850/quintal, below your target of ₹3000/quintal',
    timestamp: '2024-01-14T09:15:00Z',
    isRead: true,
    type: 'price_reached'
  },
  {
    id: '3',
    alertId: '3',
    commodity: 'Wheat',
    location: 'Kozhikode',
    currentPrice: 2400,
    targetPrice: 2500,
    message: 'Wheat price in Kozhikode has changed by 4.2% in the last 24 hours',
    timestamp: '2024-01-13T16:45:00Z',
    isRead: false,
    type: 'price_change'
  }
];

export default function PriceAlertsScreen() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(MOCK_ALERTS);
  const [notifications, setNotifications] = useState<AlertNotification[]>(MOCK_NOTIFICATIONS);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<PriceAlert | null>(null);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  
  // Form state for creating/editing alerts
  const [formData, setFormData] = useState({
    commodity: '',
    location: '',
    targetPrice: '',
    condition: 'above' as 'above' | 'below' | 'change',
    changePercent: ''
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConditionText = (condition: string, changePercent?: number) => {
    switch (condition) {
      case 'above':
        return 'Price above target';
      case 'below':
        return 'Price below target';
      case 'change':
        return `Price change by ${changePercent}%`;
      default:
        return condition;
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'above':
        return <TrendingUp size={16} color="#22C55E" />;
      case 'below':
        return <TrendingDown size={16} color="#EF4444" />;
      case 'change':
        return <Target size={16} color="#3B82F6" />;
      default:
        return <AlertCircle size={16} color="#6B7280" />;
    }
  };

  const toggleAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const deleteAlert = (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this price alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setAlerts(prev => prev.filter(alert => alert.id !== alertId))
        }
      ]
    );
  };

  const createAlert = () => {
    if (!formData.commodity || !formData.location || !formData.targetPrice) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      commodity: formData.commodity,
      location: formData.location,
      targetPrice: parseFloat(formData.targetPrice),
      condition: formData.condition,
      changePercent: formData.condition === 'change' ? parseFloat(formData.changePercent) : undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      triggerCount: 0
    };

    setAlerts(prev => [newAlert, ...prev]);
    setShowCreateAlert(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      commodity: '',
      location: '',
      targetPrice: '',
      condition: 'above',
      changePercent: ''
    });
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    ));
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
            <View style={styles.locationRow}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.locationText}>{alert.location}</Text>
            </View>
          </View>
          <View style={styles.alertActions}>
            <Switch
              value={alert.isActive}
              onValueChange={() => toggleAlert(alert.id)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={alert.isActive ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.alertDetails}>
          <View style={styles.targetPriceSection}>
            <Text style={styles.targetPriceLabel}>Target Price</Text>
            <Text style={styles.targetPriceValue}>{formatPrice(alert.targetPrice)}</Text>
          </View>
          <View style={styles.conditionSection}>
            <View style={styles.conditionRow}>
              {getConditionIcon(alert.condition)}
              <Text style={styles.conditionText}>
                {getConditionText(alert.condition, alert.changePercent)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.alertStats}>
          <View style={styles.statItem}>
            <Clock size={14} color="#6B7280" />
            <Text style={styles.statText}>
              Created {formatDate(alert.createdAt)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Bell size={14} color="#6B7280" />
            <Text style={styles.statText}>
              Triggered {alert.triggerCount} times
            </Text>
          </View>
        </View>

        <View style={styles.alertFooter}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setEditingAlert(alert)}
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

  const renderNotificationCard = (notification: AlertNotification) => (
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
          {notification.type === 'price_reached' ? (
            <CheckCircle size={20} color="#22C55E" />
          ) : notification.type === 'price_change' ? (
            <TrendingUp size={20} color="#3B82F6" />
          ) : (
            <Bell size={20} color="#F59E0B" />
          )}
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>
            {notification.commodity} - {notification.location}
          </Text>
          <Text style={styles.notificationTime}>
            {formatDate(notification.timestamp)}
          </Text>
        </View>
        {!notification.isRead && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.notificationMessage}>{notification.message}</Text>
      <View style={styles.notificationPrice}>
        <Text style={styles.currentPriceText}>
          Current: {formatPrice(notification.currentPrice)}
        </Text>
        <Text style={styles.targetPriceText}>
          Target: {formatPrice(notification.targetPrice)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCreateAlertModal = () => (
    <Modal
      visible={showCreateAlert}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateAlert(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.createAlertModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Price Alert</Text>
            <TouchableOpacity onPress={() => setShowCreateAlert(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Commodity *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Tomato, Rice, Wheat"
                value={formData.commodity}
                onChangeText={(text) => setFormData(prev => ({ ...prev, commodity: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Location *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Kochi, Thiruvananthapuram"
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Target Price *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter target price"
                value={formData.targetPrice}
                onChangeText={(text) => setFormData(prev => ({ ...prev, targetPrice: text }))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Alert Condition</Text>
              <View style={styles.conditionOptions}>
                <TouchableOpacity
                  style={[
                    styles.conditionOption,
                    formData.condition === 'above' && styles.conditionOptionActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, condition: 'above' }))}
                >
                  <TrendingUp size={16} color={formData.condition === 'above' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[
                    styles.conditionOptionText,
                    formData.condition === 'above' && styles.conditionOptionTextActive
                  ]}>
                    Price Above
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.conditionOption,
                    formData.condition === 'below' && styles.conditionOptionActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, condition: 'below' }))}
                >
                  <TrendingDown size={16} color={formData.condition === 'below' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[
                    styles.conditionOptionText,
                    formData.condition === 'below' && styles.conditionOptionTextActive
                  ]}>
                    Price Below
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.conditionOption,
                    formData.condition === 'change' && styles.conditionOptionActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, condition: 'change' }))}
                >
                  <Target size={16} color={formData.condition === 'change' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[
                    styles.conditionOptionText,
                    formData.condition === 'change' && styles.conditionOptionTextActive
                  ]}>
                    Price Change
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {formData.condition === 'change' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Change Percentage</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., 5"
                  value={formData.changePercent}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, changePercent: text }))}
                  keyboardType="numeric"
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCreateAlert(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={createAlert}
            >
              <Text style={styles.createButtonText}>Create Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
          <Text style={styles.headerTitle}>Price Alerts</Text>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} color="#1F2937" />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {notifications.filter(n => !n.isRead).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Notifications Panel */}
        {showNotifications && (
          <View style={styles.notificationsPanel}>
            <View style={styles.notificationsHeader}>
              <Text style={styles.notificationsTitle}>Recent Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.notificationsList}>
              {notifications.map(renderNotificationCard)}
            </ScrollView>
          </View>
        )}

        {/* Alerts List */}
        <ScrollView style={styles.alertsList} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Price Alerts</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowCreateAlert(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Alert</Text>
            </TouchableOpacity>
          </View>

          {alerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Price Alerts</Text>
              <Text style={styles.emptySubtitle}>
                Create alerts to get notified when commodity prices reach your target levels
              </Text>
            </View>
          ) : (
            alerts.map(renderAlertCard)
          )}
        </ScrollView>

        {renderCreateAlertModal()}
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
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  notificationsPanel: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    maxHeight: 300,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  notificationCard: {
    backgroundColor: '#F9FAFB',
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
  notificationPrice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  currentPriceText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  targetPriceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  alertsList: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  alertActions: {
    marginLeft: 12,
  },
  alertDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  targetPriceSection: {
    flex: 1,
  },
  targetPriceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  targetPriceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  conditionSection: {
    alignItems: 'flex-end',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  alertStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  createAlertModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  conditionOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  conditionOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  conditionOptionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  conditionOptionTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
