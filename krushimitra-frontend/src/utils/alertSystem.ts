import AsyncStorage from '@react-native-async-storage/async-storage';
import { pinnedItemsManager } from './pinnedItems';

// Storage keys
const STORAGE_KEYS = {
  PRICE_ALERTS: 'price_alerts',
  NOTIFICATIONS: 'notifications',
  ALERT_SETTINGS: 'alert_settings',
  DAILY_SUMMARIES: 'daily_summaries'
};

// Data interfaces
interface PriceAlert {
  id: string;
  commodity: string;
  location: string;
  currentPrice: number;
  targetPrice: number;
  condition: 'above' | 'below' | 'change_percent';
  changePercent?: number;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
  pinnedItemId?: string;
  alertType: 'best_price' | 'price_drop' | 'price_rise' | 'custom';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'price_alert' | 'daily_summary' | 'market_update' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
  timestamp: string;
  isRead: boolean;
  isDelivered: boolean;
  actionUrl?: string;
  category?: string;
}

interface DailySummary {
  id: string;
  date: string;
  topCommodities: {
    commodity: string;
    location: string;
    currentPrice: number;
    profitPotential: number;
    profitPercent: number;
    reason: string;
    trend: 'rising' | 'falling' | 'stable';
    recommendation: 'buy' | 'sell' | 'hold' | 'watch';
  }[];
  marketInsights: {
    totalCommodities: number;
    averagePriceChange: number;
    topPerformingCategory: string;
    marketTrend: 'bullish' | 'bearish' | 'neutral';
    keyInsights: string[];
  };
  alertsTriggered: number;
  notificationsSent: number;
}

interface AlertSettings {
  priceAlertsEnabled: boolean;
  dailySummaryEnabled: boolean;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  alertFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
  maxAlertsPerDay: number;
  alertThresholds: {
    priceChangePercent: number;
    profitPotentialPercent: number;
    volumeThreshold: number;
  };
}

// Default settings
const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  priceAlertsEnabled: true,
  dailySummaryEnabled: true,
  pushNotificationsEnabled: true,
  emailNotificationsEnabled: false,
  smsNotificationsEnabled: false,
  alertFrequency: 'immediate',
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '07:00'
  },
  maxAlertsPerDay: 50,
  alertThresholds: {
    priceChangePercent: 5,
    profitPotentialPercent: 10,
    volumeThreshold: 100
  }
};

class AlertSystem {
  private static instance: AlertSystem;
  private alerts: PriceAlert[] = [];
  private notifications: Notification[] = [];
  private settings: AlertSettings = DEFAULT_ALERT_SETTINGS;
  private dailySummaries: DailySummary[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private alertCheckInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.initializeStorage();
  }

  public static getInstance(): AlertSystem {
    if (!AlertSystem.instance) {
      AlertSystem.instance = new AlertSystem();
    }
    return AlertSystem.instance;
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Load alerts
      const alertsData = await AsyncStorage.getItem(STORAGE_KEYS.PRICE_ALERTS);
      this.alerts = alertsData ? JSON.parse(alertsData) : [];

      // Load notifications
      const notificationsData = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      this.notifications = notificationsData ? JSON.parse(notificationsData) : [];

      // Load settings
      const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.ALERT_SETTINGS);
      this.settings = settingsData ? JSON.parse(settingsData) : DEFAULT_ALERT_SETTINGS;

      // Load daily summaries
      const summariesData = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_SUMMARIES);
      this.dailySummaries = summariesData ? JSON.parse(summariesData) : [];

      // Start alert checking
      this.startAlertChecking();
    } catch (error) {
      console.error('Error initializing alert system:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.PRICE_ALERTS, JSON.stringify(this.alerts)),
        AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications)),
        AsyncStorage.setItem(STORAGE_KEYS.ALERT_SETTINGS, JSON.stringify(this.settings)),
        AsyncStorage.setItem(STORAGE_KEYS.DAILY_SUMMARIES, JSON.stringify(this.dailySummaries))
      ]);
    } catch (error) {
      console.error('Error saving alert system data:', error);
    }
  }

  private startAlertChecking(): void {
    // Check for alerts every 5 minutes
    this.alertCheckInterval = setInterval(() => {
      this.checkPriceAlerts();
    }, 5 * 60 * 1000);
  }

  private async checkPriceAlerts(): Promise<void> {
    if (!this.settings.priceAlertsEnabled) return;

    const pinnedItems = pinnedItemsManager.getPinnedItems();
    
    for (const item of pinnedItems) {
      await this.checkItemAlerts(item);
    }
  }

  private async checkItemAlerts(item: any): Promise<void> {
    // Check for best price alerts
    const bestPriceAlert = this.alerts.find(
      alert => alert.pinnedItemId === item.id && 
               alert.alertType === 'best_price' && 
               alert.isActive
    );

    if (bestPriceAlert) {
      const shouldTrigger = this.shouldTriggerAlert(bestPriceAlert, item);
      if (shouldTrigger) {
        await this.triggerAlert(bestPriceAlert, item);
      }
    }

    // Check for price change alerts
    const priceChangeAlert = this.alerts.find(
      alert => alert.pinnedItemId === item.id && 
               alert.alertType === 'price_rise' && 
               alert.isActive
    );

    if (priceChangeAlert) {
      const shouldTrigger = this.shouldTriggerPriceChangeAlert(priceChangeAlert, item);
      if (shouldTrigger) {
        await this.triggerAlert(priceChangeAlert, item);
      }
    }
  }

  private shouldTriggerAlert(alert: PriceAlert, item: any): boolean {
    switch (alert.condition) {
      case 'above':
        return item.price >= alert.targetPrice;
      case 'below':
        return item.price <= alert.targetPrice;
      case 'change_percent':
        if (!alert.changePercent) return false;
        const changePercent = ((item.price - item.previousPrice) / item.previousPrice) * 100;
        return Math.abs(changePercent) >= alert.changePercent;
      default:
        return false;
    }
  }

  private shouldTriggerPriceChangeAlert(alert: PriceAlert, item: any): boolean {
    const changePercent = ((item.price - item.previousPrice) / item.previousPrice) * 100;
    return Math.abs(changePercent) >= this.settings.alertThresholds.priceChangePercent;
  }

  private async triggerAlert(alert: PriceAlert, item: any): Promise<void> {
    // Update alert trigger count
    alert.triggerCount++;
    alert.lastTriggered = new Date().toISOString();

    // Create notification
    const notification = await this.createNotification({
      title: this.getAlertTitle(alert, item),
      message: this.getAlertMessage(alert, item),
      type: 'price_alert',
      priority: alert.priority,
      data: {
        alertId: alert.id,
        commodity: item.commodity,
        location: item.location,
        currentPrice: item.price,
        targetPrice: alert.targetPrice
      },
      category: item.category
    });

    // Save updates
    await this.saveToStorage();
    this.notifyListeners();
  }

  private getAlertTitle(alert: PriceAlert, item: any): string {
    switch (alert.alertType) {
      case 'best_price':
        return `Best Price Alert: ${item.commodity}`;
      case 'price_rise':
        return `Price Rise Alert: ${item.commodity}`;
      case 'price_drop':
        return `Price Drop Alert: ${item.commodity}`;
      default:
        return `Price Alert: ${item.commodity}`;
    }
  }

  private getAlertMessage(alert: PriceAlert, item: any): string {
    const price = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(item.price);

    switch (alert.condition) {
      case 'above':
        return `${item.commodity} in ${item.location} has reached ${price}, above your target of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(alert.targetPrice)}`;
      case 'below':
        return `${item.commodity} in ${item.location} has dropped to ${price}, below your target of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(alert.targetPrice)}`;
      case 'change_percent':
        const changePercent = ((item.price - item.previousPrice) / item.previousPrice) * 100;
        return `${item.commodity} in ${item.location} has changed by ${changePercent.toFixed(1)}% to ${price}`;
      default:
        return `${item.commodity} in ${item.location} is now ${price}`;
    }
  }

  // Public API methods
  public addListener(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async createPriceAlert(
    commodity: string,
    location: string,
    currentPrice: number,
    targetPrice: number,
    condition: 'above' | 'below' | 'change_percent',
    changePercent?: number,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    alertType: 'best_price' | 'price_drop' | 'price_rise' | 'custom' = 'best_price',
    pinnedItemId?: string
  ): Promise<string> {
    const alert: PriceAlert = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      commodity,
      location,
      currentPrice,
      targetPrice,
      condition,
      changePercent,
      isActive: true,
      priority,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
      pinnedItemId,
      alertType
    };

    this.alerts.push(alert);
    await this.saveToStorage();
    return alert.id;
  }

  public async updatePriceAlert(alertId: string, updates: Partial<PriceAlert>): Promise<void> {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex > -1) {
      this.alerts[alertIndex] = { ...this.alerts[alertIndex], ...updates };
      await this.saveToStorage();
    }
  }

  public async deletePriceAlert(alertId: string): Promise<void> {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    await this.saveToStorage();
  }

  public getPriceAlerts(): PriceAlert[] {
    return [...this.alerts];
  }

  public getActivePriceAlerts(): PriceAlert[] {
    return this.alerts.filter(alert => alert.isActive);
  }

  public async createNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'isDelivered'>): Promise<string> {
    const newNotification: Notification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false,
      isDelivered: false,
      ...notification
    };

    this.notifications.push(newNotification);
    await this.saveToStorage();
    this.notifyListeners();

    // Deliver notification if enabled
    if (this.settings.pushNotificationsEnabled) {
      await this.deliverNotification(newNotification);
    }

    return newNotification.id;
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    // In a real app, this would integrate with push notification services
    console.log('Delivering notification:', notification.title);
    notification.isDelivered = true;
    await this.saveToStorage();
  }

  public getNotifications(): Notification[] {
    return [...this.notifications].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getUnreadNotificationCount(): number {
    return this.notifications.filter(notif => !notif.isRead).length;
  }

  public async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(notif => notif.id === notificationId);
    if (notification) {
      notification.isRead = true;
      await this.saveToStorage();
      this.notifyListeners();
    }
  }

  public async markAllNotificationsAsRead(): Promise<void> {
    this.notifications.forEach(notif => notif.isRead = true);
    await this.saveToStorage();
    this.notifyListeners();
  }

  public async clearNotifications(): Promise<void> {
    this.notifications = [];
    await this.saveToStorage();
    this.notifyListeners();
  }

  public async generateDailySummary(): Promise<DailySummary> {
    const today = new Date().toISOString().split('T')[0];
    const pinnedItems = pinnedItemsManager.getPinnedItems();
    
    // Calculate profit potential for each commodity
    const commoditiesWithProfit = pinnedItems.map(item => {
      const profitPotential = this.calculateProfitPotential(item);
      return {
        commodity: item.commodity,
        location: item.location,
        currentPrice: item.price,
        profitPotential: profitPotential.amount,
        profitPercent: profitPotential.percent,
        reason: profitPotential.reason,
        trend: this.determineTrend(item),
        recommendation: this.getRecommendation(item, profitPotential)
      };
    });

    // Sort by profit potential
    const topCommodities = commoditiesWithProfit
      .sort((a, b) => b.profitPotential - a.profitPotential)
      .slice(0, 10);

    // Calculate market insights
    const marketInsights = this.calculateMarketInsights(pinnedItems);

    const summary: DailySummary = {
      id: Date.now().toString(),
      date: today,
      topCommodities,
      marketInsights,
      alertsTriggered: this.alerts.filter(alert => 
        alert.lastTriggered && alert.lastTriggered.startsWith(today)
      ).length,
      notificationsSent: this.notifications.filter(notif => 
        notif.timestamp.startsWith(today)
      ).length
    };

    this.dailySummaries.push(summary);
    await this.saveToStorage();

    // Send daily summary notification
    if (this.settings.dailySummaryEnabled) {
      await this.createNotification({
        title: 'Daily Market Summary',
        message: `Top ${topCommodities.length} commodities with highest profit potential today`,
        type: 'daily_summary',
        priority: 'medium',
        data: summary
      });
    }

    return summary;
  }

  private calculateProfitPotential(item: any): { amount: number; percent: number; reason: string } {
    const changePercent = item.changePercent || 0;
    const priceChange = item.change || 0;
    
    // Simple profit potential calculation
    const profitPercent = Math.abs(changePercent);
    const profitAmount = Math.abs(priceChange);
    
    let reason = '';
    if (changePercent > 0) {
      reason = 'Price is rising, good selling opportunity';
    } else if (changePercent < 0) {
      reason = 'Price is falling, good buying opportunity';
    } else {
      reason = 'Stable price, monitor for changes';
    }

    return {
      amount: profitAmount,
      percent: profitPercent,
      reason
    };
  }

  private determineTrend(item: any): 'rising' | 'falling' | 'stable' {
    const changePercent = item.changePercent || 0;
    if (changePercent > 2) return 'rising';
    if (changePercent < -2) return 'falling';
    return 'stable';
  }

  private getRecommendation(item: any, profitPotential: any): 'buy' | 'sell' | 'hold' | 'watch' {
    const changePercent = item.changePercent || 0;
    const profitPercent = profitPotential.percent;

    if (changePercent > 5 && profitPercent > 10) return 'sell';
    if (changePercent < -5 && profitPercent > 10) return 'buy';
    if (profitPercent > 5) return 'watch';
    return 'hold';
  }

  private calculateMarketInsights(items: any[]): DailySummary['marketInsights'] {
    const totalCommodities = items.length;
    const averagePriceChange = items.reduce((sum, item) => sum + (item.changePercent || 0), 0) / totalCommodities;
    
    // Group by category
    const categoryChanges = items.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item.changePercent || 0);
      return acc;
    }, {} as Record<string, number[]>);

    const topPerformingCategory = Object.entries(categoryChanges)
      .map(([category, changes]) => ({
        category,
        avgChange: (changes as number[]).reduce((sum: number, change: number) => sum + change, 0) / (changes as number[]).length
      }))
      .sort((a, b) => b.avgChange - a.avgChange)[0]?.category || 'Unknown';

    const marketTrend = averagePriceChange > 2 ? 'bullish' : 
                       averagePriceChange < -2 ? 'bearish' : 'neutral';

    const keyInsights = [
      `Average price change: ${averagePriceChange.toFixed(1)}%`,
      `Top performing category: ${topPerformingCategory}`,
      `Market trend: ${marketTrend}`,
      `${totalCommodities} commodities being tracked`
    ];

    return {
      totalCommodities,
      averagePriceChange,
      topPerformingCategory,
      marketTrend,
      keyInsights
    };
  }

  public getDailySummaries(): DailySummary[] {
    return [...this.dailySummaries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public getLatestDailySummary(): DailySummary | null {
    return this.dailySummaries.length > 0 ? this.dailySummaries[this.dailySummaries.length - 1] : null;
  }

  public async updateSettings(settings: Partial<AlertSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveToStorage();
  }

  public getSettings(): AlertSettings {
    return { ...this.settings };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  public destroy(): void {
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const alertSystem = AlertSystem.getInstance();

// Export types
export type { PriceAlert, Notification, DailySummary, AlertSettings };
