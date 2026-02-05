import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { offlineStorage } from './offlineStorage';
import { realtimeUpdates } from './realtimeUpdates';
import { serverManager } from '../services/serverManager';
import { debugDedup } from './log';

interface NetworkStatus {
  isConnected: boolean;
  type: string | null;
  isInternetReachable: boolean | null;
  lastConnected: number | null;
  lastDisconnected: number | null;
}

interface NetworkCallbacks {
  onConnect: () => void;
  onDisconnect: () => void;
  onReconnect: () => void;
}

class NetworkManager {
  private static instance: NetworkManager;
  private networkStatus: NetworkStatus = {
    isConnected: false,
    type: null,
    isInternetReachable: null,
    lastConnected: null,
    lastDisconnected: null
  };
  private callbacks: NetworkCallbacks[] = [];
  private syncInProgress: boolean = false;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.initializeNetworkMonitoring();
  }

  // Track last processed network change to throttle flapping
  // Debounce window tracking
  private _lastNetworkChange: number | null = null;
  // Track offline start for stable reconnection discovery
  private _offlineStartedAt: number | null = null;

  public static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  private initializeNetworkMonitoring(): void {
    // Subscribe to network state changes
    NetInfo.addEventListener(state => {
      this.handleNetworkChange(state);
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      this.handleNetworkChange(state);
    });

    // Start periodic sync when online
    this.startPeriodicSync();
  }

  private handleNetworkChange(state: any): void {
    // Defensive override for React Native Web fake states
    if (Platform.OS === 'web') {
      if (
        state.type === 'other' ||
        state.type === 'unknown' ||
        state.isConnected === false ||
        state.isInternetReachable === false
      ) {
        state = {
          ...state,
          isConnected: true,
          isInternetReachable: true,
          type: 'wifi'
        };
        debugDedup('[NetworkManager] Overrode fake web NetInfo state -> wifi:true');
      }
    }

    // Debounce rapid successive network events (<5s apart)
    if (this._lastNetworkChange && Date.now() - this._lastNetworkChange < 5000) {
      return;
    }
    this._lastNetworkChange = Date.now();

    const wasConnected = this.networkStatus.isConnected;
    const isConnected = Boolean(state.isConnected && state.isInternetReachable);

    // Track offline start time
    if (!isConnected && wasConnected) {
      this._offlineStartedAt = Date.now();
    }

    this.networkStatus = {
      isConnected,
      type: state.type,
      isInternetReachable: state.isInternetReachable,
      lastConnected: isConnected ? Date.now() : this.networkStatus.lastConnected,
      lastDisconnected: !isConnected ? Date.now() : this.networkStatus.lastDisconnected
    };

    // Update offline storage manager
    offlineStorage.setOnlineStatus(isConnected);

    // Real-time updates: only trigger reconnect when online
    if (isConnected) {
      realtimeUpdates.reconnect();
    } else {
      realtimeUpdates.disconnect();
    }

    // Notify callbacks & handle reconnection logic
    if (isConnected && !wasConnected) {
      this.notifyCallbacks('onConnect');
      this.handleReconnection();
      // Offline -> Online stable discovery trigger (after >=10s offline & 10s stable online)
      const offlineDuration = this._offlineStartedAt ? Date.now() - this._offlineStartedAt : 0;
      if (offlineDuration >= 10000) {
        const STABLE_DELAY = 10000; // wait for 10s stable before discovery
        setTimeout(() => {
          if (this.isOnline()) {
            serverManager.refresh(true, 'offline-to-online-stable');
          }
        }, STABLE_DELAY);
      }
    } else if (!isConnected && wasConnected) {
      this.notifyCallbacks('onDisconnect');
    }

    debugDedup(`[NetworkManager] Status change isConnected=${isConnected} type=${state.type}`);
  }

  private handleReconnection(): void {
    // Trigger immediate sync when reconnecting
    this.triggerSync();
  }

  private startPeriodicSync(): void {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.networkStatus.isConnected && !this.syncInProgress) {
        this.triggerSync();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  private async triggerSync(): Promise<void> {
    if (this.syncInProgress || !this.networkStatus.isConnected) return;

    this.syncInProgress = true;
    console.debug('[NetworkManager] Starting data sync');

    try {
      // Sync offline queue
      await offlineStorage.syncOfflineData();

      // Force real-time updates sync
      await realtimeUpdates.forceSync();

      // Clean up expired cache
      await offlineStorage.cleanupStorage();

      console.debug('[NetworkManager] Data sync completed');
    } catch (error) {
      console.error('[NetworkManager] Error during data sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private notifyCallbacks(event: keyof NetworkCallbacks): void {
    this.callbacks.forEach(callback => {
      try {
        callback[event]();
      } catch (error) {
        console.error(`[NetworkManager] Error in network callback ${event}:`, error);
      }
    });
  }

  // Public API methods
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  public isOnline(): boolean {
    return this.networkStatus.isConnected;
  }

  // Convenience alias for external stability checks
  public isConnected(): boolean {
    return this.isOnline();
  }

  public isOffline(): boolean {
    return !this.networkStatus.isConnected;
  }

  public getConnectionType(): string | null {
    return this.networkStatus.type;
  }

  public getLastConnectedTime(): number | null {
    return this.networkStatus.lastConnected;
  }

  public getLastDisconnectedTime(): number | null {
    return this.networkStatus.lastDisconnected;
  }

  public getOfflineDuration(): number | null {
    if (this.networkStatus.isConnected || !this.networkStatus.lastDisconnected) {
      return null;
    }
    return Date.now() - this.networkStatus.lastDisconnected;
  }

  public addCallback(callback: NetworkCallbacks): void {
    this.callbacks.push(callback);
  }

  public removeCallback(callback: NetworkCallbacks): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  public async forceSync(): Promise<void> {
    await this.triggerSync();
  }

  public async getNetworkQuality(): Promise<'excellent' | 'good' | 'fair' | 'poor'> {
    try {
      const state = await NetInfo.fetch();
      
      if (!state.isConnected || !state.isInternetReachable) {
        return 'poor';
      }

      // Simple quality assessment based on connection type
      switch (state.type) {
        case 'wifi':
          return 'excellent';
        case 'cellular':
          return 'good';
        case 'ethernet':
          return 'excellent';
        default:
          return 'fair';
      }
    } catch (error) {
      console.error('Error assessing network quality:', error);
      return 'poor';
    }
  }

  public async getDataUsage(): Promise<{
    totalBytes: number;
    wifiBytes: number;
    cellularBytes: number;
  }> {
    // This would typically integrate with a data usage tracking library
    // For now, return mock data
    return {
      totalBytes: 0,
      wifiBytes: 0,
      cellularBytes: 0
    };
  }

  public async checkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return Boolean(state.isConnected && state.isInternetReachable);
    } catch (error) {
      console.error('Error checking connectivity:', error);
      return false;
    }
  }

  public async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, timeoutMs);

      const callback: NetworkCallbacks = {
        onConnect: () => {
          clearTimeout(timeout);
          this.removeCallback(callback);
          resolve(true);
        },
        onDisconnect: () => {},
        onReconnect: () => {}
      };

      this.addCallback(callback);
    });
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.callbacks = [];
  }
}

// Export singleton instance
export const networkManager = NetworkManager.getInstance();

// Export types
export type { NetworkStatus, NetworkCallbacks };
