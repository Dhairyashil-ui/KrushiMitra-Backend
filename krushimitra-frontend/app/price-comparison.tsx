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
  Platform,
  Share,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Plus, 
  X, 
  Download, 
  Share2, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  MapPin,
  Calendar,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageCircle
} from 'lucide-react-native';

interface ComparisonItem {
  id: string;
  commodity: string;
  location: string;
  currentPrice: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  quality: string;
  date: string;
  isSelected: boolean;
}

interface ComparisonData {
  id: string;
  name: string;
  items: ComparisonItem[];
  createdAt: string;
  lastUpdated: string;
}

const MOCK_COMPARISON_DATA: ComparisonData[] = [
  {
    id: '1',
    name: 'Tomato Price Comparison',
    createdAt: '2024-01-15T10:00:00Z',
    lastUpdated: '2024-01-15T14:30:00Z',
    items: [
      {
        id: '1',
        commodity: 'Tomato',
        location: 'Kochi',
        currentPrice: 45,
        previousPrice: 42,
        change: 3,
        changePercent: 7.1,
        quality: 'Premium',
        date: '2024-01-15T14:30:00Z',
        isSelected: true
      },
      {
        id: '2',
        commodity: 'Tomato',
        location: 'Thiruvananthapuram',
        currentPrice: 42,
        previousPrice: 40,
        change: 2,
        changePercent: 5.0,
        quality: 'Good',
        date: '2024-01-15T14:30:00Z',
        isSelected: true
      },
      {
        id: '3',
        commodity: 'Tomato',
        location: 'Kozhikode',
        currentPrice: 48,
        previousPrice: 45,
        change: 3,
        changePercent: 6.7,
        quality: 'Premium',
        date: '2024-01-15T14:30:00Z',
        isSelected: true
      }
    ]
  },
  {
    id: '2',
    name: 'Rice Market Analysis',
    createdAt: '2024-01-14T09:00:00Z',
    lastUpdated: '2024-01-15T14:30:00Z',
    items: [
      {
        id: '4',
        commodity: 'Rice',
        location: 'Kochi',
        currentPrice: 2800,
        previousPrice: 2850,
        change: -50,
        changePercent: -1.8,
        quality: 'Good',
        date: '2024-01-15T14:30:00Z',
        isSelected: true
      },
      {
        id: '5',
        commodity: 'Rice',
        location: 'Thiruvananthapuram',
        currentPrice: 2750,
        previousPrice: 2800,
        change: -50,
        changePercent: -1.8,
        quality: 'Good',
        date: '2024-01-15T14:30:00Z',
        isSelected: true
      }
    ]
  }
];

const MOCK_AVAILABLE_ITEMS: ComparisonItem[] = [
  {
    id: '6',
    commodity: 'Wheat',
    location: 'Kochi',
    currentPrice: 2400,
    previousPrice: 2350,
    change: 50,
    changePercent: 2.1,
    quality: 'Premium',
    date: '2024-01-15T14:30:00Z',
    isSelected: false
  },
  {
    id: '7',
    commodity: 'Onion',
    location: 'Thiruvananthapuram',
    currentPrice: 35,
    previousPrice: 38,
    change: -3,
    changePercent: -7.9,
    quality: 'Average',
    date: '2024-01-15T14:30:00Z',
    isSelected: false
  },
  {
    id: '8',
    commodity: 'Potato',
    location: 'Kozhikode',
    currentPrice: 25,
    previousPrice: 22,
    change: 3,
    changePercent: 13.6,
    quality: 'Good',
    date: '2024-01-15T14:30:00Z',
    isSelected: false
  }
];

export default function PriceComparisonScreen() {
  const [comparisons, setComparisons] = useState<ComparisonData[]>(MOCK_COMPARISON_DATA);
  const [availableItems, setAvailableItems] = useState<ComparisonItem[]>(MOCK_AVAILABLE_ITEMS);
  const [selectedComparison, setSelectedComparison] = useState<ComparisonData | null>(null);
  const [showAddItems, setShowAddItems] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'image'>('pdf');
  
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

  const getChangeColor = (change: number) => {
    if (change > 0) return '#22C55E';
    if (change < 0) return '#EF4444';
    return '#6B7280';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={16} color="#22C55E" />;
    if (change < 0) return <TrendingDown size={16} color="#EF4444" />;
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

  const toggleItemSelection = (itemId: string) => {
    setAvailableItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isSelected: !item.isSelected } : item
    ));
  };

  const addSelectedItems = () => {
    const selectedItems = availableItems.filter(item => item.isSelected);
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to add to comparison.');
      return;
    }

    if (selectedComparison) {
      const updatedComparison = {
        ...selectedComparison,
        items: [...selectedComparison.items, ...selectedItems],
        lastUpdated: new Date().toISOString()
      };
      setComparisons(prev => prev.map(comp => 
        comp.id === selectedComparison.id ? updatedComparison : comp
      ));
      setSelectedComparison(updatedComparison);
    }
    
    setShowAddItems(false);
    setAvailableItems(prev => prev.map(item => ({ ...item, isSelected: false })));
  };

  const removeItem = (comparisonId: string, itemId: string) => {
    setComparisons(prev => prev.map(comp => 
      comp.id === comparisonId 
        ? { 
            ...comp, 
            items: comp.items.filter(item => item.id !== itemId),
            lastUpdated: new Date().toISOString()
          }
        : comp
    ));
    
    if (selectedComparison?.id === comparisonId) {
      const updatedComparison = comparisons.find(comp => comp.id === comparisonId);
      if (updatedComparison) {
        setSelectedComparison({
          ...updatedComparison,
          items: updatedComparison.items.filter(item => item.id !== itemId),
          lastUpdated: new Date().toISOString()
        });
      }
    }
  };

  const createNewComparison = () => {
    const newComparison: ComparisonData = {
      id: Date.now().toString(),
      name: `Comparison ${comparisons.length + 1}`,
      items: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    setComparisons(prev => [newComparison, ...prev]);
    setSelectedComparison(newComparison);
  };

  const exportComparison = async () => {
    if (!selectedComparison) return;

    const shareContent = {
      title: selectedComparison.name,
      message: generateComparisonText(selectedComparison),
      url: 'https://krushimitra.app/comparison/' + selectedComparison.id
    };

    try {
      await Share.share(shareContent);
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export comparison. Please try again.');
    }
  };

  const generateComparisonText = (comparison: ComparisonData) => {
    let text = `${comparison.name}\n\n`;
    text += `Generated on: ${formatDate(comparison.lastUpdated)}\n\n`;
    
    comparison.items.forEach((item, index) => {
      text += `${index + 1}. ${item.commodity} - ${item.location}\n`;
      text += `   Current Price: ${formatPrice(item.currentPrice)}\n`;
      text += `   Previous Price: ${formatPrice(item.previousPrice)}\n`;
      text += `   Change: ${item.change > 0 ? '+' : ''}${formatPrice(item.change)} (${item.change > 0 ? '+' : ''}${item.changePercent.toFixed(1)}%)\n`;
      text += `   Quality: ${item.quality}\n\n`;
    });
    
    return text;
  };

  const renderComparisonCard = (comparison: ComparisonData) => (
    <Animated.View
      key={comparison.id}
      style={[
        styles.comparisonCard,
        selectedComparison?.id === comparison.id && styles.selectedComparisonCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <TouchableOpacity
        onPress={() => setSelectedComparison(comparison)}
        style={styles.comparisonCardTouchable}
      >
        <LinearGradient
          colors={selectedComparison?.id === comparison.id 
            ? ['#EFF6FF', '#DBEAFE'] 
            : ['#FFFFFF', '#F8FAFC']
          }
          style={styles.comparisonCardGradient}
        >
          <View style={styles.comparisonHeader}>
            <View style={styles.comparisonInfo}>
              <Text style={styles.comparisonName}>{comparison.name}</Text>
              <Text style={styles.comparisonMeta}>
                {comparison.items.length} items • Updated {formatDate(comparison.lastUpdated)}
              </Text>
            </View>
            <View style={styles.comparisonActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowExportModal(true)}
              >
                <Download size={16} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowAddItems(true)}
              >
                <Plus size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.comparisonItems}>
            {comparison.items.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.comparisonItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemCommodity}>{item.commodity}</Text>
                  <View style={styles.itemLocation}>
                    <MapPin size={12} color="#6B7280" />
                    <Text style={styles.itemLocationText}>{item.location}</Text>
                  </View>
                </View>
                <View style={styles.itemPrice}>
                  <Text style={styles.itemCurrentPrice}>{formatPrice(item.currentPrice)}</Text>
                  <View style={styles.itemChange}>
                    {getChangeIcon(item.change)}
                    <Text style={[
                      styles.itemChangeText,
                      { color: getChangeColor(item.change) }
                    ]}>
                      {item.change > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            {comparison.items.length > 3 && (
              <Text style={styles.moreItemsText}>
                +{comparison.items.length - 3} more items
              </Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSelectedComparison = () => {
    if (!selectedComparison) return null;

    return (
      <View style={styles.selectedComparisonContainer}>
        <View style={styles.selectedComparisonHeader}>
          <Text style={styles.selectedComparisonTitle}>{selectedComparison.name}</Text>
          <View style={styles.selectedComparisonActions}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => setShowExportModal(true)}
            >
              <Download size={16} color="#FFFFFF" />
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={exportComparison}
            >
              <Share2 size={16} color="#3B82F6" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.selectedComparisonList}>
          {selectedComparison.items.map((item) => (
            <View key={item.id} style={styles.selectedItemCard}>
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.selectedItemGradient}
              >
                <View style={styles.selectedItemHeader}>
                  <View style={styles.selectedItemInfo}>
                    <Text style={styles.selectedItemCommodity}>{item.commodity}</Text>
                    <View style={styles.selectedItemLocation}>
                      <MapPin size={14} color="#6B7280" />
                      <Text style={styles.selectedItemLocationText}>{item.location}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(selectedComparison.id, item.id)}
                  >
                    <X size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.selectedItemDetails}>
                  <View style={styles.priceSection}>
                    <Text style={styles.currentPriceLabel}>Current Price</Text>
                    <Text style={styles.currentPriceValue}>{formatPrice(item.currentPrice)}</Text>
                  </View>
                  <View style={styles.priceSection}>
                    <Text style={styles.previousPriceLabel}>Previous Price</Text>
                    <Text style={styles.previousPriceValue}>{formatPrice(item.previousPrice)}</Text>
                  </View>
                  <View style={styles.priceSection}>
                    <Text style={styles.changeLabel}>Change</Text>
                    <View style={styles.changeContainer}>
                      {getChangeIcon(item.change)}
                      <Text style={[
                        styles.changeValue,
                        { color: getChangeColor(item.change) }
                      ]}>
                        {item.change > 0 ? '+' : ''}{formatPrice(Math.abs(item.change))}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.selectedItemFooter}>
                  <View style={styles.qualityBadge}>
                    <Text style={[
                      styles.qualityText,
                      { color: getQualityColor(item.quality) }
                    ]}>
                      {item.quality}
                    </Text>
                  </View>
                  <Text style={styles.itemDate}>{formatDate(item.date)}</Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAddItemsModal = () => (
    <Modal
      visible={showAddItems}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddItems(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.addItemsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Items to Comparison</Text>
            <TouchableOpacity onPress={() => setShowAddItems(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {availableItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.availableItemCard,
                  item.isSelected && styles.selectedAvailableItemCard
                ]}
                onPress={() => toggleItemSelection(item.id)}
              >
                <View style={styles.availableItemInfo}>
                  <Text style={styles.availableItemCommodity}>{item.commodity}</Text>
                  <View style={styles.availableItemLocation}>
                    <MapPin size={12} color="#6B7280" />
                    <Text style={styles.availableItemLocationText}>{item.location}</Text>
                  </View>
                </View>
                <View style={styles.availableItemPrice}>
                  <Text style={styles.availableItemCurrentPrice}>{formatPrice(item.currentPrice)}</Text>
                  <View style={styles.availableItemChange}>
                    {getChangeIcon(item.change)}
                    <Text style={[
                      styles.availableItemChangeText,
                      { color: getChangeColor(item.change) }
                    ]}>
                      {item.change > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                    </Text>
                  </View>
                </View>
                {item.isSelected && (
                  <CheckCircle size={20} color="#22C55E" style={styles.selectionIcon} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowAddItems(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={addSelectedItems}
            >
              <Text style={styles.addButtonText}>Add Selected</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderExportModal = () => (
    <Modal
      visible={showExportModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowExportModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.exportModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Export Comparison</Text>
            <TouchableOpacity onPress={() => setShowExportModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.exportOptions}>
            <TouchableOpacity
              style={[
                styles.exportOption,
                exportFormat === 'pdf' && styles.exportOptionActive
              ]}
              onPress={() => setExportFormat('pdf')}
            >
              <FileText size={24} color={exportFormat === 'pdf' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[
                styles.exportOptionText,
                exportFormat === 'pdf' && styles.exportOptionTextActive
              ]}>
                PDF Document
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.exportOption,
                exportFormat === 'excel' && styles.exportOptionActive
              ]}
              onPress={() => setExportFormat('excel')}
            >
              <BarChart3 size={24} color={exportFormat === 'excel' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[
                styles.exportOptionText,
                exportFormat === 'excel' && styles.exportOptionTextActive
              ]}>
                Excel Spreadsheet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.exportOption,
                exportFormat === 'image' && styles.exportOptionActive
              ]}
              onPress={() => setExportFormat('image')}
            >
              <ImageIcon size={24} color={exportFormat === 'image' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[
                styles.exportOptionText,
                exportFormat === 'image' && styles.exportOptionTextActive
              ]}>
                Image
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.exportConfirmButton}
              onPress={() => {
                Alert.alert('Export Started', `Exporting comparison as ${exportFormat.toUpperCase()}...`);
                setShowExportModal(false);
              }}
            >
              <Text style={styles.exportConfirmButtonText}>Export</Text>
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
          <Text style={styles.headerTitle}>Price Comparison</Text>
          <TouchableOpacity 
            style={styles.newComparisonButton}
            onPress={createNewComparison}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Comparisons List */}
        <ScrollView style={styles.comparisonsList} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Comparisons</Text>
            <Text style={styles.sectionSubtitle}>
              {comparisons.length} comparison{comparisons.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {comparisons.length === 0 ? (
            <View style={styles.emptyState}>
              <BarChart3 size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Comparisons Yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first price comparison to analyze market trends
              </Text>
              <TouchableOpacity 
                style={styles.createFirstButton}
                onPress={createNewComparison}
              >
                <Text style={styles.createFirstButtonText}>Create Comparison</Text>
              </TouchableOpacity>
            </View>
          ) : (
            comparisons.map(renderComparisonCard)
          )}
        </ScrollView>

        {/* Selected Comparison Details */}
        {renderSelectedComparison()}

        {renderAddItemsModal()}
        {renderExportModal()}
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
  newComparisonButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonsList: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  comparisonCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedComparisonCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  comparisonCardTouchable: {
    borderRadius: 16,
  },
  comparisonCardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  comparisonInfo: {
    flex: 1,
  },
  comparisonName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  comparisonMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  comparisonActions: {
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
  comparisonItems: {
    gap: 12,
  },
  comparisonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemCommodity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLocationText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  itemCurrentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemChangeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  moreItemsText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedComparisonContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    maxHeight: Dimensions.get('window').height * 0.4,
  },
  selectedComparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedComparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  selectedComparisonActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  exportButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  shareButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  selectedComparisonList: {
    padding: 20,
  },
  selectedItemCard: {
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedItemGradient: {
    padding: 16,
    borderRadius: 12,
  },
  selectedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemCommodity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  selectedItemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedItemLocationText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceSection: {
    alignItems: 'center',
  },
  currentPriceLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  currentPriceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  previousPriceLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  previousPriceValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  changeLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeValue: {
    marginLeft: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qualityBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  qualityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemDate: {
    fontSize: 10,
    color: '#6B7280',
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
  createFirstButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createFirstButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addItemsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  exportModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
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
  availableItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedAvailableItemCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  availableItemInfo: {
    flex: 1,
  },
  availableItemCommodity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  availableItemLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableItemLocationText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  availableItemPrice: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  availableItemCurrentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  availableItemChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableItemChangeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  selectionIcon: {
    position: 'absolute',
    right: 16,
  },
  exportOptions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  exportOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  exportOptionTextActive: {
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
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exportConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  exportConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
