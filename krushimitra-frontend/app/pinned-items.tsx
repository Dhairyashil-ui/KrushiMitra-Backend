import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput,
  Modal,
  Animated,
  Alert,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Plus, 
  X, 
  Pin, 
  PinOff,
  Heart,
  HeartOff,
  Bell,
  BellOff,
  Edit3,
  Trash2,
  MoreVertical,
  Star,
  MapPin,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Settings
} from 'lucide-react-native';
import { pinnedItemsManager, PinnedItem, PinnedCategory } from '../src/utils/pinnedItems';

export default function PinnedItemsScreen() {
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>([]);
  const [categories, setCategories] = useState<PinnedCategory[]>([]);
  const [filteredItems, setFilteredItems] = useState<PinnedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState<PinnedItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date' | 'favorite'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadPinnedItems();
    loadCategories();
    
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

  useEffect(() => {
    filterAndSortItems();
  }, [pinnedItems, selectedCategory, searchQuery, sortBy, sortOrder, showFavoritesOnly]);

  const loadPinnedItems = async () => {
    try {
      const items = pinnedItemsManager.getPinnedItems();
      setPinnedItems(items);
      
      // Subscribe to updates
      const unsubscribe = pinnedItemsManager.addListener((items) => {
        setPinnedItems(items);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error loading pinned items:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = pinnedItemsManager.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterAndSortItems = () => {
    let filtered = [...pinnedItems];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.commodity.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.quality.toLowerCase().includes(query) ||
        (item.customNotes && item.customNotes.toLowerCase().includes(query))
      );
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(item => item.isFavorite);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.commodity.localeCompare(b.commodity);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'date':
          comparison = new Date(a.pinnedAt).getTime() - new Date(b.pinnedAt).getTime();
          break;
        case 'favorite':
          comparison = (a.isFavorite ? 1 : 0) - (b.isFavorite ? 1 : 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredItems(filtered);
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

  const getChangeColor = (change: number) => {
    if (change > 0) return '#22C55E';
    if (change < 0) return '#EF4444';
    return '#6B7280';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={14} color="#22C55E" />;
    if (change < 0) return <TrendingDown size={14} color="#EF4444" />;
    return null;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Premium': return '#22C55E';
      case 'Good': return '#3B82F6';
      case 'Average': return '#F59E0B';
      case 'Fair': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const toggleFavorite = async (itemId: string) => {
    try {
      await pinnedItemsManager.toggleFavorite(itemId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const unpinItem = async (itemId: string) => {
    Alert.alert(
      'Unpin Item',
      'Are you sure you want to remove this item from your pinned list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unpin', 
          style: 'destructive',
          onPress: async () => {
            try {
              await pinnedItemsManager.unpinItem(itemId);
            } catch (error) {
              console.error('Error unpinning item:', error);
            }
          }
        }
      ]
    );
  };

  const renderPinnedItem = (item: PinnedItem) => (
    <Animated.View
      key={item.id}
      style={[
        styles.itemCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.itemCardGradient}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.commodityName}>{item.commodity}</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          </View>
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleFavorite(item.id)}
            >
              {item.isFavorite ? (
                <Heart size={16} color="#EF4444" />
              ) : (
                <HeartOff size={16} color="#6B7280" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowItemDetails(item)}
            >
              <MoreVertical size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <View style={styles.priceSection}>
            <Text style={styles.currentPrice}>{formatPrice(item.price)}</Text>
            <View style={styles.changeRow}>
              {getChangeIcon(item.change)}
              <Text style={[
                styles.changeText,
                { color: getChangeColor(item.change) }
              ]}>
                {item.change > 0 ? '+' : ''}{formatPrice(Math.abs(item.change))}
              </Text>
            </View>
          </View>
          <View style={styles.qualitySection}>
            <View style={[
              styles.qualityBadge,
              { backgroundColor: getQualityColor(item.quality) + '20' }
            ]}>
              <Text style={[
                styles.qualityText,
                { color: getQualityColor(item.quality) }
              ]}>
                {item.quality}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.categoryInfo}>
            <Tag size={12} color="#6B7280" />
            <Text style={styles.categoryText}>
              {categories.find(cat => cat.id === item.category)?.name || 'Uncategorized'}
            </Text>
          </View>
          <View style={styles.dateInfo}>
            <Calendar size={12} color="#6B7280" />
            <Text style={styles.dateText}>
              Pinned {formatDate(item.pinnedAt)}
            </Text>
          </View>
        </View>

        {item.customNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesText}>{item.customNotes}</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  const renderCategoryFilter = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      <TouchableOpacity
        style={[
          styles.categoryButton,
          selectedCategory === 'all' && styles.categoryButtonActive
        ]}
        onPress={() => setSelectedCategory('all')}
      >
        <Text style={[
          styles.categoryButtonText,
          selectedCategory === 'all' && styles.categoryButtonTextActive
        ]}>
          All ({pinnedItems.length})
        </Text>
      </TouchableOpacity>
      
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.categoryButtonActive,
            { borderColor: category.color }
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category.id && styles.categoryButtonTextActive
          ]}>
            {category.name} ({category.itemCount})
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderItemDetailsModal = () => (
    <Modal
      visible={!!showItemDetails}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowItemDetails(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.itemDetailsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Item Details</Text>
            <TouchableOpacity onPress={() => setShowItemDetails(null)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {showItemDetails && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Commodity</Text>
                <Text style={styles.detailValue}>{showItemDetails.commodity}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{showItemDetails.location}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Current Price</Text>
                <Text style={styles.detailValue}>{formatPrice(showItemDetails.price)}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Price Change</Text>
                <View style={styles.changeContainer}>
                  {getChangeIcon(showItemDetails.change)}
                  <Text style={[
                    styles.changeValue,
                    { color: getChangeColor(showItemDetails.change) }
                  ]}>
                    {showItemDetails.change > 0 ? '+' : ''}{formatPrice(Math.abs(showItemDetails.change))} 
                    ({showItemDetails.change > 0 ? '+' : ''}{showItemDetails.changePercent.toFixed(1)}%)
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Quality</Text>
                <View style={[
                  styles.qualityBadge,
                  { backgroundColor: getQualityColor(showItemDetails.quality) + '20' }
                ]}>
                  <Text style={[
                    styles.qualityText,
                    { color: getQualityColor(showItemDetails.quality) }
                  ]}>
                    {showItemDetails.quality}
                  </Text>
                </View>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>
                  {categories.find(cat => cat.id === showItemDetails.category)?.name || 'Uncategorized'}
                </Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Pinned At</Text>
                <Text style={styles.detailValue}>{formatDate(showItemDetails.pinnedAt)}</Text>
              </View>
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Last Updated</Text>
                <Text style={styles.detailValue}>{formatDate(showItemDetails.lastUpdated)}</Text>
              </View>
              
              {showItemDetails.customNotes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailValue}>{showItemDetails.customNotes}</Text>
                </View>
              )}
            </ScrollView>
          )}

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.unpinButton}
              onPress={() => {
                if (showItemDetails) {
                  unpinItem(showItemDetails.id);
                  setShowItemDetails(null);
                }
              }}
            >
              <PinOff size={16} color="#EF4444" />
              <Text style={styles.unpinButtonText}>Unpin Item</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowItemDetails(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
          <Text style={styles.headerTitle}>Pinned Items</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Settings size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search pinned items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        {renderCategoryFilter()}

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Sort by:</Text>
              <View style={styles.sortButtons}>
                {(['name', 'price', 'date', 'favorite'] as const).map((sort) => (
                  <TouchableOpacity
                    key={sort}
                    style={[
                      styles.sortButton,
                      sortBy === sort && styles.sortButtonActive
                    ]}
                    onPress={() => setSortBy(sort)}
                  >
                    <Text style={[
                      styles.sortButtonText,
                      sortBy === sort && styles.sortButtonTextActive
                    ]}>
                      {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[
                  styles.favoriteFilter,
                  showFavoritesOnly && styles.favoriteFilterActive
                ]}
                onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Heart size={16} color={showFavoritesOnly ? '#FFFFFF' : '#6B7280'} />
                <Text style={[
                  styles.favoriteFilterText,
                  showFavoritesOnly && styles.favoriteFilterTextActive
                ]}>
                  Favorites Only
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Items List */}
        <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Pin size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No items found' : 'No pinned items'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Pin items from the mandi prices page to see them here'
                }
              </Text>
            </View>
          ) : (
            filteredItems.map(renderPinnedItem)
          )}
        </ScrollView>

        {renderItemDetailsModal()}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  categoryFilter: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryFilterContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  sortButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  favoriteFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  favoriteFilterActive: {
    backgroundColor: '#EF4444',
  },
  favoriteFilterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  favoriteFilterTextActive: {
    color: '#FFFFFF',
  },
  itemsList: {
    flex: 1,
    padding: 20,
  },
  itemCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemCardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemInfo: {
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
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceSection: {
    flex: 1,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  qualitySection: {
    alignItems: 'flex-end',
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
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
  itemDetailsModal: {
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
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeValue: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  unpinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  unpinButtonText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  closeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
