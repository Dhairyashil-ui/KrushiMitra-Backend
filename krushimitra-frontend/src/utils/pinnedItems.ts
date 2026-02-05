import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  PINNED_ITEMS: 'pinned_items',
  PINNED_CATEGORIES: 'pinned_categories',
  PINNED_NOTIFICATIONS: 'pinned_notifications'
};

// Data interfaces
interface PinnedItem {
  id: string;
  commodity: string;
  location: string;
  price: number;
  change: number;
  changePercent: number;
  quality: string;
  category: string;
  subcategory?: string;
  pinnedAt: string;
  lastUpdated: string;
  isFavorite: boolean;
  customNotes?: string;
  priceAlerts: {
    enabled: boolean;
    targetPrice?: number;
    condition: 'above' | 'below' | 'change';
    changePercent?: number;
  };
}

interface PinnedCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
  createdAt: string;
  isDefault: boolean;
}

interface PinnedNotification {
  id: string;
  itemId: string;
  commodity: string;
  location: string;
  message: string;
  type: 'price_alert' | 'price_change' | 'quality_update' | 'general';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

// Default categories
const DEFAULT_CATEGORIES: PinnedCategory[] = [
  {
    id: 'favorite_fruits',
    name: 'Favorite Fruits',
    icon: '🍎',
    color: '#F59E0B',
    itemCount: 0,
    createdAt: new Date().toISOString(),
    isDefault: true
  },
  {
    id: 'favorite_vegetables',
    name: 'Favorite Vegetables',
    icon: '🥬',
    color: '#22C55E',
    itemCount: 0,
    createdAt: new Date().toISOString(),
    isDefault: true
  },
  {
    id: 'favorite_cereals',
    name: 'Favorite Cereals',
    icon: '🌾',
    color: '#8B5CF6',
    itemCount: 0,
    createdAt: new Date().toISOString(),
    isDefault: true
  },
  {
    id: 'watchlist',
    name: 'Watchlist',
    icon: '👁️',
    color: '#3B82F6',
    itemCount: 0,
    createdAt: new Date().toISOString(),
    isDefault: true
  }
];

class PinnedItemsManager {
  private static instance: PinnedItemsManager;
  private pinnedItems: PinnedItem[] = [];
  private categories: PinnedCategory[] = [];
  private notifications: PinnedNotification[] = [];
  private listeners: ((items: PinnedItem[]) => void)[] = [];

  private constructor() {
    this.initializeStorage();
  }

  public static getInstance(): PinnedItemsManager {
    if (!PinnedItemsManager.instance) {
      PinnedItemsManager.instance = new PinnedItemsManager();
    }
    return PinnedItemsManager.instance;
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Load pinned items
      const itemsData = await AsyncStorage.getItem(STORAGE_KEYS.PINNED_ITEMS);
      this.pinnedItems = itemsData ? JSON.parse(itemsData) : [];

      // Load categories
      const categoriesData = await AsyncStorage.getItem(STORAGE_KEYS.PINNED_CATEGORIES);
      this.categories = categoriesData ? JSON.parse(categoriesData) : DEFAULT_CATEGORIES;

      // Load notifications
      const notificationsData = await AsyncStorage.getItem(STORAGE_KEYS.PINNED_NOTIFICATIONS);
      this.notifications = notificationsData ? JSON.parse(notificationsData) : [];

      // Update category counts
      this.updateCategoryCounts();
    } catch (error) {
      console.error('Error initializing pinned items storage:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.PINNED_ITEMS, JSON.stringify(this.pinnedItems)),
        AsyncStorage.setItem(STORAGE_KEYS.PINNED_CATEGORIES, JSON.stringify(this.categories)),
        AsyncStorage.setItem(STORAGE_KEYS.PINNED_NOTIFICATIONS, JSON.stringify(this.notifications))
      ]);
    } catch (error) {
      console.error('Error saving pinned items to storage:', error);
    }
  }

  private updateCategoryCounts(): void {
    this.categories.forEach(category => {
      category.itemCount = this.pinnedItems.filter(item => item.category === category.id).length;
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.pinnedItems));
  }

  // Public API methods
  public addListener(listener: (items: PinnedItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async pinItem(
    commodity: string,
    location: string,
    price: number,
    change: number,
    changePercent: number,
    quality: string,
    category: string,
    subcategory?: string,
    customNotes?: string
  ): Promise<string> {
    const existingItem = this.pinnedItems.find(
      item => item.commodity === commodity && item.location === location
    );

    if (existingItem) {
      // Update existing item
      existingItem.price = price;
      existingItem.change = change;
      existingItem.changePercent = changePercent;
      existingItem.quality = quality;
      existingItem.lastUpdated = new Date().toISOString();
      if (customNotes) existingItem.customNotes = customNotes;
    } else {
      // Create new pinned item
      const newItem: PinnedItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        commodity,
        location,
        price,
        change,
        changePercent,
        quality,
        category,
        subcategory,
        pinnedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        isFavorite: false,
        customNotes,
        priceAlerts: {
          enabled: false,
          condition: 'above'
        }
      };
      this.pinnedItems.push(newItem);
    }

    this.updateCategoryCounts();
    await this.saveToStorage();
    this.notifyListeners();

    return existingItem?.id || this.pinnedItems[this.pinnedItems.length - 1].id;
  }

  public async unpinItem(itemId: string): Promise<void> {
    this.pinnedItems = this.pinnedItems.filter(item => item.id !== itemId);
    this.updateCategoryCounts();
    await this.saveToStorage();
    this.notifyListeners();
  }

  public async updatePinnedItem(itemId: string, updates: Partial<PinnedItem>): Promise<void> {
    const itemIndex = this.pinnedItems.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
      this.pinnedItems[itemIndex] = {
        ...this.pinnedItems[itemIndex],
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      this.updateCategoryCounts();
      await this.saveToStorage();
      this.notifyListeners();
    }
  }

  public getPinnedItems(): PinnedItem[] {
    return [...this.pinnedItems];
  }

  public getPinnedItemsByCategory(categoryId: string): PinnedItem[] {
    return this.pinnedItems.filter(item => item.category === categoryId);
  }

  public getPinnedItem(itemId: string): PinnedItem | undefined {
    return this.pinnedItems.find(item => item.id === itemId);
  }

  public isPinned(commodity: string, location: string): boolean {
    return this.pinnedItems.some(
      item => item.commodity === commodity && item.location === location
    );
  }

  public getPinnedItemId(commodity: string, location: string): string | undefined {
    const item = this.pinnedItems.find(
      item => item.commodity === commodity && item.location === location
    );
    return item?.id;
  }

  public async createCategory(
    name: string,
    icon: string,
    color: string
  ): Promise<string> {
    const newCategory: PinnedCategory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      icon,
      color,
      itemCount: 0,
      createdAt: new Date().toISOString(),
      isDefault: false
    };

    this.categories.push(newCategory);
    await this.saveToStorage();
    return newCategory.id;
  }

  public getCategories(): PinnedCategory[] {
    return [...this.categories];
  }

  public async deleteCategory(categoryId: string): Promise<void> {
    // Move items from deleted category to watchlist
    const watchlistCategory = this.categories.find(cat => cat.id === 'watchlist');
    if (watchlistCategory) {
      this.pinnedItems.forEach(item => {
        if (item.category === categoryId) {
          item.category = 'watchlist';
        }
      });
    }

    this.categories = this.categories.filter(cat => cat.id !== categoryId);
    this.updateCategoryCounts();
    await this.saveToStorage();
    this.notifyListeners();
  }

  public async updateItemCategory(itemId: string, newCategoryId: string): Promise<void> {
    const item = this.pinnedItems.find(item => item.id === itemId);
    if (item) {
      item.category = newCategoryId;
      this.updateCategoryCounts();
      await this.saveToStorage();
      this.notifyListeners();
    }
  }

  public async toggleFavorite(itemId: string): Promise<void> {
    const item = this.pinnedItems.find(item => item.id === itemId);
    if (item) {
      item.isFavorite = !item.isFavorite;
      await this.saveToStorage();
      this.notifyListeners();
    }
  }

  public async updatePriceAlerts(
    itemId: string,
    alerts: PinnedItem['priceAlerts']
  ): Promise<void> {
    const item = this.pinnedItems.find(item => item.id === itemId);
    if (item) {
      item.priceAlerts = alerts;
      await this.saveToStorage();
      this.notifyListeners();
    }
  }

  public async addNotification(notification: Omit<PinnedNotification, 'id'>): Promise<void> {
    const newNotification: PinnedNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...notification
    };
    this.notifications.push(newNotification);
    await this.saveToStorage();
  }

  public getNotifications(): PinnedNotification[] {
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
    }
  }

  public async markAllNotificationsAsRead(): Promise<void> {
    this.notifications.forEach(notif => notif.isRead = true);
    await this.saveToStorage();
  }

  public async clearNotifications(): Promise<void> {
    this.notifications = [];
    await this.saveToStorage();
  }

  public async searchPinnedItems(query: string): Promise<PinnedItem[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.pinnedItems.filter(item =>
      item.commodity.toLowerCase().includes(lowercaseQuery) ||
      item.location.toLowerCase().includes(lowercaseQuery) ||
      item.quality.toLowerCase().includes(lowercaseQuery) ||
      (item.customNotes && item.customNotes.toLowerCase().includes(lowercaseQuery))
    );
  }

  public async getStatistics(): Promise<{
    totalItems: number;
    favoriteItems: number;
    categoriesCount: number;
    notificationsCount: number;
    unreadNotifications: number;
  }> {
    return {
      totalItems: this.pinnedItems.length,
      favoriteItems: this.pinnedItems.filter(item => item.isFavorite).length,
      categoriesCount: this.categories.length,
      notificationsCount: this.notifications.length,
      unreadNotifications: this.getUnreadNotificationCount()
    };
  }

  public async clearAllData(): Promise<void> {
    this.pinnedItems = [];
    this.categories = DEFAULT_CATEGORIES;
    this.notifications = [];
    await this.saveToStorage();
    this.notifyListeners();
  }
}

// Export singleton instance
export const pinnedItemsManager = PinnedItemsManager.getInstance();

// Export types
export type { PinnedItem, PinnedCategory, PinnedNotification };
