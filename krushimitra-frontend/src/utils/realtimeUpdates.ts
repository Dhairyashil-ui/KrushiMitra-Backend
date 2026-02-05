import { offlineStorage } from './offlineStorage';
import { networkManager } from './networkManager';
import { debugDedup } from './log';

// Real-time update interfaces
interface PriceUpdate {
  id: string;
  commodity: string;
  location: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  timestamp: number;
  quality: string;
  volume: number;
}

interface MarketUpdate {
  type: 'price_change' | 'new_commodity' | 'market_alert' | 'trend_update';
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface Subscription {
  id: string;
  type: string;
  filters: any;
  callback: (update: any) => void;
  isActive: boolean;
}

class RealTimeUpdateManager {
  private static instance: RealTimeUpdateManager;
  private subscriptions: Map<string, Subscription> = new Map();
  private updateQueue: MarketUpdate[] = [];
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 10000; // base interval (dynamic backoff applied)
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastReconnectAttempt: number = 0; // Track last reconnection time
  private isNetworkFlapping: boolean = false; // Track network instability
  private stableSince: number | null = null; // Track when connection became stable
  private _lastReconnect: number | null = null; // Throttle reconnect spam (8s)

  private constructor() {
    this.initializeConnection();
  }

  public static getInstance(): RealTimeUpdateManager {
    if (!RealTimeUpdateManager.instance) {
      RealTimeUpdateManager.instance = new RealTimeUpdateManager();
    }
    return RealTimeUpdateManager.instance;
  }

  private initializeConnection(): void {
    this.startConnection();
    this.startHeartbeat();
    this.startUpdateProcessor();
  }

  private startConnection(): void {
    // In a real implementation, this would establish WebSocket connection
    // For now, we'll simulate with periodic updates
    this.isConnected = true;
    this.stableSince = Date.now();
    this.reconnectAttempts = 0;
    
    // Simulate real-time updates every 30 seconds
    this.updateInterval = setInterval(() => {
      this.simulatePriceUpdates();
    }, 30000);

    debugDedup('[Realtime] Connection established');
  }

  private startHeartbeat(): void {
    // Send heartbeat every 30 seconds to maintain connection
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendHeartbeat();
      } else {
        this.attemptReconnection();
      }
    }, 30000);
  }

  private startUpdateProcessor(): void {
    // Process queued updates every 5 seconds
    setInterval(() => {
      this.processUpdateQueue();
    }, 5000);
  }

  private sendHeartbeat(): void {
    // In a real implementation, this would send a ping to the server
    debugDedup('[Realtime] Heartbeat sent');
  }

  private attemptReconnection(): void {
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastReconnectAttempt;

    // Suppress if too soon (<8s) to avoid storms
    if (timeSinceLastAttempt < 8000) {
      debugDedup('[Realtime] Reconnection suppressed (interval <8s)');
      return;
    }

    if (this.isNetworkFlapping) {
      debugDedup('[Realtime] Network flapping – skip reconnect');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Realtime] Max reconnection attempts reached');
      return;
    }

    this.lastReconnectAttempt = now;
    this.stableSince = null;
    this.reconnectAttempts++;

    // Backoff strategy: 1st=3s, 2nd=8s, then exponential 16s,32s capped 60s
    let delay: number;
    if (this.reconnectAttempts === 1) delay = 3000;
    else if (this.reconnectAttempts === 2) delay = 8000;
    else delay = Math.min(16000 * Math.pow(2, this.reconnectAttempts - 3), 60000);

    debugDedup(`[Realtime] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${Math.round(delay/1000)}s`);

    setTimeout(async () => {
      // Wait additional stability window before actual connect
      const STABLE_MS = 3000;
      await new Promise(r => setTimeout(r, STABLE_MS));
      if (!networkManager.isConnected()) {
        debugDedup('[Realtime] Network not stable after wait — skipping reconnect');
        return;
      }
      this.startConnection();
    }, delay);
  }

  private simulatePriceUpdates(): void {
    // Simulate real-time price updates
    const mockUpdates: PriceUpdate[] = [
      {
        id: '1',
        commodity: 'Tomato',
        location: 'Kochi',
        price: 45 + Math.random() * 10 - 5, // Random price between 40-50
        previousPrice: 45,
        change: 0,
        changePercent: 0,
        timestamp: Date.now(),
        quality: 'Premium',
        volume: 1000 + Math.random() * 500
      },
      {
        id: '2',
        commodity: 'Rice',
        location: 'Thiruvananthapuram',
        price: 2800 + Math.random() * 200 - 100, // Random price between 2700-2900
        previousPrice: 2800,
        change: 0,
        changePercent: 0,
        timestamp: Date.now(),
        quality: 'Good',
        volume: 800 + Math.random() * 400
      },
      {
        id: '3',
        commodity: 'Wheat',
        location: 'Kozhikode',
        price: 2400 + Math.random() * 100 - 50, // Random price between 2350-2450
        previousPrice: 2400,
        change: 0,
        changePercent: 0,
        timestamp: Date.now(),
        quality: 'Premium',
        volume: 1200 + Math.random() * 600
      }
    ];

    // Calculate changes
    mockUpdates.forEach(update => {
      update.change = update.price - update.previousPrice;
      update.changePercent = (update.change / update.previousPrice) * 100;
    });

    // Process each update
    mockUpdates.forEach(update => {
      this.processPriceUpdate(update);
    });
  }

  private processPriceUpdate(update: PriceUpdate): void {
    // Update local cache
    this.updateLocalCache(update);

    // Notify subscribers
    this.notifySubscribers('price_update', update);

    // Check for significant changes that might trigger alerts
    if (Math.abs(update.changePercent) > 5) {
      this.createMarketAlert(update);
    }

    // Add to update queue for offline processing
    this.addToUpdateQueue({
      type: 'price_change',
      data: update,
      timestamp: Date.now(),
      priority: Math.abs(update.changePercent) > 10 ? 'high' : 'medium'
    });
  }

  private updateLocalCache(update: PriceUpdate): void {
    // Update cached mandi prices
    offlineStorage.getCachedMandiPrices().then(cachedPrices => {
      if (cachedPrices) {
        const updatedPrices = cachedPrices.map(price => 
          price._id === update.id ? {
            ...price,
            price: update.price,
            change: update.change,
            changePercent: update.changePercent,
            date: new Date(update.timestamp).toISOString()
          } : price
        );
        offlineStorage.cacheMandiPrices(updatedPrices);
      }
    });
  }

  private createMarketAlert(update: PriceUpdate): void {
    const alert: MarketUpdate = {
      type: 'market_alert',
      data: {
        commodity: update.commodity,
        location: update.location,
        change: update.change,
        changePercent: update.changePercent,
        message: `${update.commodity} price in ${update.location} has changed by ${update.changePercent.toFixed(1)}%`
      },
      timestamp: Date.now(),
      priority: Math.abs(update.changePercent) > 15 ? 'critical' : 'high'
    };

    this.addToUpdateQueue(alert);
    this.notifySubscribers('market_alert', alert);
  }

  private addToUpdateQueue(update: MarketUpdate): void {
    this.updateQueue.push(update);
    
    // Keep only last 100 updates to prevent memory issues
    if (this.updateQueue.length > 100) {
      this.updateQueue = this.updateQueue.slice(-100);
    }
  }

  private processUpdateQueue(): void {
    if (this.updateQueue.length === 0) return;

    const updates = [...this.updateQueue];
    this.updateQueue = [];

    // Process updates by priority
    updates.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    updates.forEach(update => {
      this.notifySubscribers(update.type, update);
    });
  }

  // Public API methods
  public subscribe(type: string, filters: any, callback: (update: any) => void): string {
    const subscriptionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const subscription: Subscription = {
      id: subscriptionId,
      type,
      filters,
      callback,
      isActive: true
    };

    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
    }
  }

  private notifySubscribers(type: string, update: any): void {
    this.subscriptions.forEach(subscription => {
      if (subscription.isActive && subscription.type === type) {
        // Apply filters if any
        if (this.matchesFilters(update, subscription.filters)) {
          subscription.callback(update);
        }
      }
    });
  }

  private matchesFilters(update: any, filters: any): boolean {
    if (!filters) return true;

    // Check commodity filter
    if (filters.commodity && update.commodity !== filters.commodity) {
      return false;
    }

    // Check location filter
    if (filters.location && update.location !== filters.location) {
      return false;
    }

    // Check category filter
    if (filters.category && update.category !== filters.category) {
      return false;
    }

    // Check price range filter
    if (filters.minPrice && update.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && update.price > filters.maxPrice) {
      return false;
    }

    return true;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  public getUpdateQueueSize(): number {
    return this.updateQueue.length;
  }

  public forceSync(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isConnected) {
        this.processUpdateQueue();
        resolve();
      } else {
        this.attemptReconnection();
        resolve();
      }
    });
  }

  public disconnect(): void {
    this.isConnected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    debugDedup('[Realtime] Connection disconnected');
  }

  public reconnect(): void {
    // Prevent rapid-fire attempts
    if (this._lastReconnect && Date.now() - this._lastReconnect < 8000) {
      debugDedup('[Realtime] Reconnect suppressed to avoid storm');
      return;
    }
    this._lastReconnect = Date.now();

    if (this.isNetworkFlapping) {
      debugDedup('[Realtime] Network unstable - defer reconnect');
      return;
    }

    // Wait for explicit stability (3s) before reconnecting
    const STABLE_MS = 3000;
    setTimeout(() => {
      if (!networkManager.isConnected()) {
        debugDedup('[Realtime] Network not stable after wait — skipping reconnect');
        return;
      }
      this.disconnect();
      this.startConnection();
    }, STABLE_MS);
  }

  /**
   * Set network flapping state (called by network listener)
   */
  public setNetworkFlapping(flapping: boolean): void {
    this.isNetworkFlapping = flapping;
    if (flapping) {
      debugDedup('[Realtime] Network flapping mode enabled');
      this.stableSince = null; // Reset stability marker
    } else {
      debugDedup('[Realtime] Network flapping mode disabled');
      this.stableSince = Date.now(); // Start stability timer
    }
  }

  // Cleanup method
  public destroy(): void {
    this.disconnect();
    this.subscriptions.clear();
    this.updateQueue = [];
  }
}

// Export singleton instance
export const realtimeUpdates = RealTimeUpdateManager.getInstance();

// Export types
export type { PriceUpdate, MarketUpdate, Subscription };
