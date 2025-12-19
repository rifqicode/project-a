import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import SearchBar from '@/components/ui/searchbar';
import { StockInterface } from '@/db/models/stock';
import { StockService } from '@/db/services/stock';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

interface StockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  location: string;
  lastUpdated: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  symbol: string;
}

interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  reason: string;
  reference: string;
}

interface UnitType {
  name: string
}

const unitTypes: UnitType[] = [{
  name: 'kg',
}, {
  name: 'gram'
}, {
  name: 'liter'
}]

export default function StockScreen() {
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showUnitTypeModal, setShowUnitTypeModal] = useState(false);
  const [stockList, setStockList] = useState<StockInterface[]>([]);
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<StockInterface & { currentStock: number }>>({
    name: '',
    sku: '',
    currentStock: 0,
    symbol: ''
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return '#10b981';
      case 'low-stock': return '#f59e0b';
      case 'out-of-stock': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-stock': return 'In Stock';
      case 'low-stock': return 'Low Stock';
      case 'out-of-stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  const handleAddStock = () => {
    setFormData({
      name: '',
      sku: '',
      currentStock: 0,
      symbol: ''
    });
    setEditMode(false);
    setShowAddModal(true);
  };

  const handleEditStock = (item: StockInterface) => {
    setFormData({
      ...item,
      currentStock: item.quantity // Map quantity to currentStock for form
    });
    setEditMode(true);
    setShowAddModal(true);
  };

  const handleViewDetail = async (item: StockInterface) => {
    // Convert StockInterface to StockItem for the modal
    const stockItem: StockItem = {
      id: item.id.toString(),
      name: item.name,
      sku: item.sku,
      currentStock: item.quantity,
      minStock: 0,
      maxStock: 0,
      location: '',
      lastUpdated: item.updatedAt,
      status: item.quantity > 0 ? 'in-stock' : 'out-of-stock',
      symbol: item.symbol
    };
    setSelectedItem(stockItem);
    
    // Fetch stock history (last 3 records)
    try {
      const history = await StockService.getStockHistory(item.id);
      setStockHistory(history.slice(0, 3)); // Get only the last 3
    } catch (error) {
      console.error('Error fetching stock history:', error);
      setStockHistory([]);
    }
    
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = async () => {
    setShowDetailModal(false);
    // Refresh data when closing detail modal in case data changed
    await getAllStocks();
  };

  const handleSelectUnitType = (item: UnitType) => {
    setFormData({
      ...formData,
      symbol: item.name
    })
    setShowUnitTypeModal(false);
  };

  // Helper function to add sample data (for testing)
  const addSampleData = async () => {
    try {
      const sampleStocks = [
        { name: 'White Sugar', symbol: 'kg', sku: 'SUGAR-001', quantity: 100 },
        { name: 'All Purpose Flour', symbol: 'kg', sku: 'FLOUR-001', quantity: 150 },
        { name: 'Cooking Oil', symbol: 'liter', sku: 'OIL-001', quantity: 50 },
        { name: 'Salt', symbol: 'kg', sku: 'SALT-001', quantity: 200 },
        { name: 'Black Pepper', symbol: 'gram', sku: 'PEPPER-001', quantity: 500 },
      ];

      for (const stock of sampleStocks) {
        await StockService.createStock(stock);
      }

      Alert.alert('Success', `Added ${sampleStocks.length} sample stocks!`);
      await getAllStocks();
    } catch (error) {
      console.error('Error adding sample data:', error);
      Alert.alert('Error', 'Failed to add sample data');
    }
  };

  const handleSaveStock = async () => {
    try {
      if (!formData.name || !formData.sku || !formData.symbol) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (editMode && formData.id) {
        // Update existing stock
        await StockService.updateStock(formData.id, {
          name: formData.name,
          symbol: formData.symbol,
          sku: formData.sku,
          quantity: formData.currentStock || 0,
        });
        Alert.alert('Success', 'Stock updated successfully!');
      } else {
        // Create new stock
        await StockService.createStock({
          name: formData.name,
          symbol: formData.symbol,
          sku: formData.sku,
          quantity: formData.currentStock || 0,
        });
        Alert.alert('Success', 'Stock added successfully!');
      }
      
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving stock:', error);
      Alert.alert('Error', 'Failed to save stock. Please try again.');
    } finally {
      // Always refresh the list after save attempt
      await getAllStocks();
    }
  };

  const handleDeleteStock = async (item: StockInterface) => {
    Alert.alert(
      'Delete Stock',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await StockService.deleteStock(item.id);
            Alert.alert('Success', 'Stock deleted successfully!');
          } catch (error) {
            console.error('Error deleting stock:', error);
            Alert.alert('Error', 'Failed to delete stock. Please try again.');
          } finally {
            // Always refresh the list after delete attempt
            await getAllStocks();
          }
        }}
      ]
    );
  };

  const getAllStocks = useCallback(async () => {
    try {
      console.log('Fetching stocks with query:', searchText);
      const stocks = await StockService.getAllStocks({
        searchQuery: searchText,
        perPage: 20,
        page: 0,
      });
      console.log('Fetched stocks:', stocks.length, 'items');
      setStockList(stocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      Alert.alert('Error', 'Failed to load stocks. Please try again.');
    }
  }, [searchText]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getAllStocks();
    setRefreshing(false);
  }, [getAllStocks]);

  useEffect(() => {
    getAllStocks();
  }, [getAllStocks]);

  // Refresh data whenever user navigates to this screen
  useFocusEffect(
    useCallback(() => {
      console.log('Stock screen focused - refreshing data');
      getAllStocks();
    }, [getAllStocks])
  );

  const renderStockItem = ({ item }: { item: StockInterface }) => (
    <Pressable style={styles.stockCard} onPress={() => handleViewDetail(item)}>
      {/* Product Header - Clean and prominent */}
      <View style={styles.stockHeader}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockName}>{item.name}</Text>
          <View style={{ flexDirection: 'row', marginTop: 10, gap: 1 }}>
            <Text style={styles.stockSku}>SKU: {item.sku}</Text>
          </View>
        </View>
        <View style={styles.stockActions}>
          <Pressable style={styles.editButton} onPress={() => handleEditStock(item)}>
            <IconSymbol name="pencil" size={16} color="#3b82f6" />
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={() => handleDeleteStock(item)}>
            <IconSymbol name="trash" size={16} color="#ef4444" />
          </Pressable>
        </View>
      </View>

      {/* Footer - Status and date with better visual hierarchy */}
      <View style={styles.stockFooter}>
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: item.quantity > 0 ? '#10b981' : '#ef4444',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20
          }
        ]}>
          <Text style={styles.statusText}>Stock: {item.quantity} {item.symbol}</Text>
        </View>
        <Text style={[styles.lastUpdated, { fontSize: 12, color: '#9ca3af' }]}>
          {new Date(item.updatedAt).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <ParallaxScrollView>
      <ThemedView style={styles.container}>
        <Header title="Stock Management" subtitle="Monitor and manage your inventory" />
        
        <View style={{
          alignItems: 'flex-end',
          paddingHorizontal: 1,
          marginBottom: 10,
        }}>
          <Pressable style={{
            backgroundColor: '#3b82f6',
            paddingVertical: 5,
            paddingHorizontal: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 10,
            width: 60,
            alignContent: 'center',
          }} onPress={handleAddStock}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search stock..."
        />

        {/* Debug: Add sample data button - Remove this after testing */}
        {stockList.length === 0 && !searchText && (
          <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
            <Pressable 
              style={[styles.sampleDataButton]} 
              onPress={addSampleData}
            >
              <IconSymbol name="sparkles" size={20} color="#ffffff" />
              <Text style={styles.sampleDataButtonText}>Add Sample Data (Testing)</Text>
            </Pressable>
          </View>
        )}

        {/* Stock List */}
        {stockList.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="tray" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No stocks found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText ? 'Try a different search term' : 'Add your first stock item'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={stockList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderStockItem}
            style={styles.stockList}
            scrollEnabled={false}
            contentContainerStyle={styles.stockListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
          />
        )}

        {/* Add/Edit Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editMode ? 'Edit Stock' : 'Add New Stock'}
                </Text>
                <Pressable onPress={() => setShowAddModal(false)}>
                  <IconSymbol name="xmark" size={24} color="#6b7280" />
                </Pressable>
              </View>

              <ScrollView style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Product Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    placeholder="Enter product name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SKU</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.sku}
                    onChangeText={(text) => setFormData({...formData, sku: text})}
                    placeholder="Enter SKU"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Stock Amount</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.currentStock?.toString()}
                      onChangeText={(text) => setFormData({...formData, currentStock: parseInt(text) || 0})}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}> Unit </Text>
                    <Pressable 
                      style={styles.unitTypeSelector}
                      onPress={() => setShowUnitTypeModal(true)}
                    >
                      {formData.symbol ? (
                        <View>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            color: '#374151',
                          }}> {formData.symbol} </Text>
                        </View>
                      ) : (
                          <Text style={{
                            fontSize: 16,
                            color: '#9ca3af',
                          }}>-</Text>
                      )}
                      <IconSymbol name="chevron.down" size={16} color="#9ca3af" />
                    </Pressable>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleSaveStock}>
                  <Text style={styles.saveButtonText}>
                    {editMode ? 'Update' : 'Save'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Detail Modal */}
        <Modal visible={showDetailModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Stock Details</Text>
                <Pressable onPress={handleCloseDetailModal}>
                  <IconSymbol name="xmark" size={24} color="#6b7280" />
                </Pressable>
              </View>

              {selectedItem && (
                <ScrollView style={styles.detailContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Product Name</Text>
                    <Text style={styles.detailValue}>{selectedItem.name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>SKU</Text>
                    <Text style={styles.detailValue}>{selectedItem.sku}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Current Stock</Text>
                    <Text style={styles.detailValue}>{selectedItem.currentStock} {selectedItem.symbol}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedItem.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedItem.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Updated</Text>
                    <Text style={styles.detailValue}>{new Date(selectedItem.lastUpdated).toLocaleDateString()}</Text>
                  </View>

                  {/* Stock History Section */}
                  {stockHistory.length > 0 && (
                    <>
                      <View style={styles.historySeparator} />
                      <Text style={styles.historyTitle}>Recent History (Last 3)</Text>
                      {stockHistory.map((history, index) => (
                        <View key={history.id} style={styles.historyItem}>
                          <View style={styles.historyIconContainer}>
                            <IconSymbol 
                              name={history.transactionType === 'IN' ? 'arrow.down.circle.fill' : 'arrow.up.circle.fill'}
                              size={24}
                              color={history.transactionType === 'IN' ? '#10b981' : '#ef4444'}
                            />
                          </View>
                          <View style={styles.historyContent}>
                            <View style={styles.historyHeader}>
                              <Text style={[
                                styles.historyType,
                                { color: history.transactionType === 'IN' ? '#10b981' : '#ef4444' }
                              ]}>
                                {history.transactionType === 'IN' ? 'Stock In' : 'Stock Out'}
                              </Text>
                              <Text style={styles.historyQuantity}>
                                {history.transactionType === 'IN' ? '+' : '-'}{history.quantity} {selectedItem.symbol}
                              </Text>
                            </View>
                            <Text style={styles.historyDate}>
                              {new Date(history.createdAt).toLocaleDateString()} {new Date(history.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </ScrollView>
              )}

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={handleCloseDetailModal}>
                  <Text style={styles.cancelButtonText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Product Selection Modal */}
        <Modal visible={showUnitTypeModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={{
              ...styles.modalContent,
              width: '70%'
            }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Unit Type</Text>
                <Pressable onPress={() => setShowUnitTypeModal(false)}>
                  <IconSymbol name="xmark" size={24} color="#6b7280" />
                </Pressable>
              </View>
              
              <FlatList
                data={unitTypes}
                keyExtractor={(item) => item.name}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.productItem}
                    onPress={() => handleSelectUnitType(item)}
                  >
                    <View style={{
                      flexDirection: 'row',
                    }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: 2,
                      }}>
                        <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                        {item.name}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          </View>
        </Modal>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 16,
  },
  unitTypeSelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    height: 40,
    fontSize: 16,
    color: '#374151',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 15,
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '600',
  },
  stockList: {
    marginTop: 16,
    marginBottom: 50
  },
  stockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  stockSku: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  stockLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  stockActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  stockDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stockMetric: {
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  stockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionList: {
    marginTop: 16,
    marginBottom: 50
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  transactionTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  transactionDetails: {
    gap: 4,
  },
  transactionQuantity: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  transactionReason: {
    fontSize: 14,
    color: '#6b7280',
  },
  transactionReference: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  formContainer: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    backgroundColor: '#ffffff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  detailContainer: {
    maxHeight: 400,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sampleDataButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sampleDataButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  stockListContent: {
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  historySeparator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  historyIconContainer: {
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyType: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  historyDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});