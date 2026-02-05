import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  MANDI_PRICES: 'mandi_prices',
  PRICE_ALERTS: 'price_alerts',
  COMPARISONS: 'price_comparisons',
  USER_PREFERENCES: 'user_preferences',
  CACHED_DATA: 'cached_data',
  LAST_SYNC: 'last_sync',
  OFFLINE_QUEUE: 'offline_queue'
};

// Data interfaces
interface CachedData {
  data: any;
  timestamp: number;
  expiry: number;
}

interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

interface UserPreferences {
  defaultLocation: string;
  preferredCategories: string[];
  priceAlertsEnabled: boolean;
  offlineMode: boolean;
  syncInterval: number; // in minutes
  cacheExpiry: number; // in hours
}

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  defaultLocation: 'Kochi',
  preferredCategories: ['Vegetables', 'Fruits', 'Cereals'],
  priceAlertsEnabled: true,
  offlineMode: false,
  syncInterval: 30,
  cacheExpiry: 24
};

class OfflineStorageManager {
  private static instance: OfflineStorageManager;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  private constructor() {
    this.initializeStorage();
  }

  public static getInstance(): OfflineStorageManager {
    if (!OfflineStorageManager.instance) {
      OfflineStorageManager.instance = new OfflineStorageManager();
    }
    return OfflineStorageManager.instance;
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Initialize with default preferences if not exists
      const preferences = await this.getUserPreferences();
      if (!preferences) {
        await this.setUserPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error) {
      console.error('Error initializing offline storage:', error);
    }
  }

  // Network status management
  public setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    if (isOnline && !this.syncInProgress) {
      this.syncOfflineData();
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Generic cache operations
  public async setCachedData(key: string, data: any, expiryHours: number = 24): Promise<void> {
    try {
      const cachedData: CachedData = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + (expiryHours * 60 * 60 * 1000)
      };
      await AsyncStorage.setItem(key, JSON.stringify(cachedData));
    } catch (error) {
      console.error(`Error caching data for key ${key}:`, error);
    }
  }

  public async getCachedData(key: string): Promise<any | null> {
    try {
      const cachedDataString = await AsyncStorage.getItem(key);
      if (!cachedDataString) return null;

      const cachedData: CachedData = JSON.parse(cachedDataString);
      
      // Check if data has expired
      if (Date.now() > cachedData.expiry) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return cachedData.data;
    } catch (error) {
      console.error(`Error retrieving cached data for key ${key}:`, error);
      return null;
    }
  }

  public async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys?.filter(key => key.startsWith('cache_')) || [];
      
      for (const key of cacheKeys) {
        const cachedDataString = await AsyncStorage.getItem(key);
        if (cachedDataString) {
          const cachedData: CachedData = JSON.parse(cachedDataString);
          if (Date.now() > cachedData.expiry) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // Mandi prices specific operations
  public async cacheMandiPrices(prices: any[]): Promise<void> {
    await this.setCachedData(STORAGE_KEYS.MANDI_PRICES, prices, 2); // 2 hours expiry
  }

  public async getCachedMandiPrices(): Promise<any[] | null> {
    return await this.getCachedData(STORAGE_KEYS.MANDI_PRICES);
  }

  // Price alerts specific operations
  public async cachePriceAlerts(alerts: any[]): Promise<void> {
    await this.setCachedData(STORAGE_KEYS.PRICE_ALERTS, alerts, 12); // 12 hours expiry
  }

  public async getCachedPriceAlerts(): Promise<any[] | null> {
    return await this.getCachedData(STORAGE_KEYS.PRICE_ALERTS);
  }

  // Price comparisons specific operations
  public async cachePriceComparisons(comparisons: any[]): Promise<void> {
    await this.setCachedData(STORAGE_KEYS.COMPARISONS, comparisons, 24); // 24 hours expiry
  }

  public async getCachedPriceComparisons(): Promise<any[] | null> {
    return await this.getCachedData(STORAGE_KEYS.COMPARISONS);
  }

  // User preferences operations
  public async setUserPreferences(preferences: UserPreferences): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  }

  public async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const preferencesString = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return preferencesString ? JSON.parse(preferencesString) : null;
    } catch (error) {
      console.error('Error retrieving user preferences:', error);
      return null;
    }
  }

  // Offline queue management
  public async addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const offlineAction: OfflineAction = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        retryCount: 0,
        ...action
      };

      const existingQueue = await this.getOfflineQueue();
      const updatedQueue = [...existingQueue, offlineAction];
      
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  }

  public async getOfflineQueue(): Promise<OfflineAction[]> {
    try {
      const queueString = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return queueString ? JSON.parse(queueString) : [];
    } catch (error) {
      console.error('Error retrieving offline queue:', error);
      return [];
    }
  }

  public async clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  }

  public async removeFromOfflineQueue(actionId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const updatedQueue = queue.filter(action => action.id !== actionId);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Error removing from offline queue:', error);
    }
  }

  // Sync operations
  public async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;

    this.syncInProgress = true;
    
    try {
      const queue = await this.getOfflineQueue();
      const successfulActions: string[] = [];

      for (const action of queue) {
        try {
          await this.processOfflineAction(action);
          successfulActions.push(action.id);
        } catch (error) {
          console.error(`Error processing offline action ${action.id}:`, error);
          // Increment retry count
          action.retryCount++;
          if (action.retryCount >= 3) {
            // Remove after 3 failed attempts
            successfulActions.push(action.id);
          }
        }
      }

      // Remove successfully processed actions
      for (const actionId of successfulActions) {
        await this.removeFromOfflineQueue(actionId);
      }

      // Update last sync timestamp
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      
    } catch (error) {
      console.error('Error syncing offline data:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processOfflineAction(action: OfflineAction): Promise<void> {
    // This would typically make API calls based on action type
    // For now, we'll simulate the processing
    switch (action.type) {
      case 'CREATE_ALERT':
        // Simulate API call to create alert
        console.log('Processing create alert action:', action.data);
        break;
      case 'UPDATE_ALERT':
        // Simulate API call to update alert
        console.log('Processing update alert action:', action.data);
        break;
      case 'DELETE_ALERT':
        // Simulate API call to delete alert
        console.log('Processing delete alert action:', action.data);
        break;
      case 'CREATE_COMPARISON':
        // Simulate API call to create comparison
        console.log('Processing create comparison action:', action.data);
        break;
      default:
        console.log('Unknown action type:', action.type);
    }
  }

  // Data validation
  public async validateCachedData(): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences();
      if (!preferences) return false;

      // Check if critical data exists
      const mandiPrices = await this.getCachedMandiPrices();
      const alerts = await this.getCachedPriceAlerts();
      
      return !!(mandiPrices && alerts);
    } catch (error) {
      console.error('Error validating cached data:', error);
      return false;
    }
  }

  // Storage cleanup
  public async cleanupStorage(): Promise<void> {
    try {
      await this.clearExpiredCache();
      
      // Remove old offline queue items (older than 7 days)
      const queue = await this.getOfflineQueue();
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentQueue = queue.filter(action => action.timestamp > sevenDaysAgo);
      
      if (recentQueue.length !== queue.length) {
        await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(recentQueue));
      }
    } catch (error) {
      console.error('Error cleaning up storage:', error);
    }
  }

  // Get storage statistics
  public async getStorageStats(): Promise<{
    totalSize: number;
    cacheSize: number;
    queueSize: number;
    lastSync: number | null;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const allData = await AsyncStorage.multiGet(keys || []);
      
      let totalSize = 0;
      let cacheSize = 0;
      let queueSize = 0;
      
      allData.forEach(([key, value]) => {
        const size = value ? value.length : 0;
        totalSize += size;
        
        if (key.startsWith('cache_')) {
          cacheSize += size;
        } else if (key === STORAGE_KEYS.OFFLINE_QUEUE) {
          queueSize += size;
        }
      });

      const lastSyncString = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      const lastSync = lastSyncString ? parseInt(lastSyncString) : null;

      return {
        totalSize,
        cacheSize,
        queueSize,
        lastSync
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalSize: 0,
        cacheSize: 0,
        queueSize: 0,
        lastSync: null
      };
    }
  }
}

// Export singleton instance
export const offlineStorage = OfflineStorageManager.getInstance();

// Export types
export type { CachedData, OfflineAction, UserPreferences };
