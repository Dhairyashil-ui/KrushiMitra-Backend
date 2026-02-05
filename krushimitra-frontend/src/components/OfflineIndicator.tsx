import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react-native';
import { networkManager } from '../utils/networkManager';
import { offlineStorage } from '../utils/offlineStorage';

interface OfflineIndicatorProps {
  onSyncPress?: () => void;
  showDetails?: boolean;
}

export default function OfflineIndicator({ 
  onSyncPress, 
  showDetails = false 
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [offlineDuration, setOfflineDuration] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  
  const slideAnim = new Animated.Value(-100);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Get initial network status
    const initialStatus = networkManager.getNetworkStatus();
    setIsOnline(initialStatus.isConnected);
    setLastSync(initialStatus.lastConnected);

    // Add network status callback
    const networkCallback = {
      onConnect: () => {
        setIsOnline(true);
        setLastSync(Date.now());
        hideIndicator();
      },
      onDisconnect: () => {
        setIsOnline(false);
        showIndicator();
      },
      onReconnect: () => {
        setIsOnline(true);
        setLastSync(Date.now());
        hideIndicator();
      }
    };

    networkManager.addCallback(networkCallback);

    // Update offline duration every second when offline
    const interval = setInterval(() => {
      if (!isOnline) {
        const duration = networkManager.getOfflineDuration();
        setOfflineDuration(duration);
      }
    }, 1000);

    return () => {
      networkManager.removeCallback(networkCallback);
      clearInterval(interval);
    };
  }, [isOnline]);

  const showIndicator = () => {
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const hideIndicator = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const handleSyncPress = async () => {
    if (syncInProgress) return;
    
    setSyncInProgress(true);
    
    try {
      if (onSyncPress) {
        await onSyncPress();
      } else {
        await networkManager.forceSync();
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  const formatDuration = (ms: number | null): string => {
    if (!ms) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isVisible && isOnline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim
        }
      ]}
    >
      <LinearGradient
        colors={isOnline ? ['#22C55E', '#16A34A'] : ['#EF4444', '#DC2626']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.statusSection}>
            {isOnline ? (
              <CheckCircle size={20} color="#FFFFFF" />
            ) : (
              <WifiOff size={20} color="#FFFFFF" />
            )}
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {isOnline ? 'Back Online' : 'You\'re Offline'}
              </Text>
              {!isOnline && (
                <Text style={styles.statusSubtitle}>
                  Offline for {formatDuration(offlineDuration)}
                </Text>
              )}
              {isOnline && lastSync && (
                <Text style={styles.statusSubtitle}>
                  Last sync: {formatLastSync(lastSync)}
                </Text>
              )}
            </View>
          </View>

          {!isOnline && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSyncPress}
              disabled={syncInProgress}
            >
              {syncInProgress ? (
                <RefreshCw size={16} color="#FFFFFF" style={styles.spinning} />
              ) : (
                <RefreshCw size={16} color="#FFFFFF" />
              )}
              <Text style={styles.syncButtonText}>
                {syncInProgress ? 'Syncing...' : 'Sync Now'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {showDetails && (
          <View style={styles.detailsSection}>
            <View style={styles.detailItem}>
              <Clock size={14} color="#FFFFFF" />
              <Text style={styles.detailText}>
                {isOnline ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <AlertCircle size={14} color="#FFFFFF" />
              <Text style={styles.detailText}>
                {isOnline ? 'All data synced' : 'Some data may be outdated'}
              </Text>
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  gradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  spinning: {
    transform: [{ rotate: '0deg' }],
  },
  detailsSection: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
