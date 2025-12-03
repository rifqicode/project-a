import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { StockInterface } from '@/db/models/stock';
import { StockService } from '@/db/services/stock';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
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

const transactionData: StockTransaction[] = [
  {
    id: '1',
    itemId: '1',
    itemName: 'Wireless Mouse',
    type: 'in',
    quantity: 20,
    date: '2025-10-22',
    reason: 'Purchase Order',
    reference: 'PO-001'
  },
  {
    id: '2',
    itemId: '2',
    itemName: 'USB Cable',
    type: 'out',
    quantity: 10,
    date: '2025-10-21',
    reason: 'Sales Order',
    reference: 'SO-045'
  },
  {
    id: '3',
    itemId: '3',
    itemName: 'Keyboard',
    type: 'out',
    quantity: 5,
    date: '2025-10-20',
    reason: 'Sales Order',
    reference: 'SO-044'
  }
];

const unitTypes: UnitType[] = [{
  name: 'kg',
}, {
  name: 'gram'
}, {
  name: 'liter'
}]

export default function StockScreen() {
  const [activeTab, setActiveTab] = useState<'list' | 'history'>('list');
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showUnitTypeModal, setShowUnitTypeModal] = useState(false);
  const [page, setPage] = useState(0);
  const [stockList, setStockList] = useState<StockInterface[]>([]);

  // Form state for add/edit
  const [formData, setFormData] = useState<Partial<StockItem>>({
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
      minStock: 0,
      maxStock: 0,
      location: ''
    });
    setEditMode(false);
    setShowAddModal(true);
  };

  const handleEditStock = (item: StockInterface) => {
    setFormData(item);
    setEditMode(true);
    setShowAddModal(true);
  };

  const handleViewDetail = (item: StockInterface) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  const handleSelectUnitType = (item: UnitType) => {
    setFormData({
      ...formData,
      symbol: item.name
    })
    setShowUnitTypeModal(false);
  };

  const handleSaveStock = () => {
    // Here you would typically save to your backend
    Alert.alert('Success', `Stock ${editMode ? 'updated' : 'added'} successfully!`);
    setShowAddModal(false);
  };

  const handleDeleteStock = (item: StockInterface) => {
    Alert.alert(
      'Delete Stock',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Here you would delete from your backend
          Alert.alert('Success', 'Stock deleted successfully!');
        }}
      ]
    );
  };

  const getAllStocks = async () => {
    const stocks = await StockService.getAllStocks({
      searchQuery: searchText,
      perPage: 20,
      page: page,
    });

    setStockList(stocks);
  };

  useEffect(() => {
    getAllStocks();
  }, [searchText, page]);

  const renderStockItem = ({ item }: { item: StockInterface }) => (
    <Pressable style={styles.stockCard} onPress={() => handleViewDetail(item)}>
      {/* Product Header - Clean and prominent */}
      <View style={styles.stockHeader}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockName}>{item.sku}</Text>
          <View style={{ flexDirection: 'row', marginTop: 4, gap: 16 }}>
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
            backgroundColor: getStatusColor('in-stock'),
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20
          }
        ]}>
          <Text style={styles.statusText}>Stock</Text>
          <Text style={styles.statusText}>{item.quantity}</Text>
        </View>
        <Text style={[styles.lastUpdated, { fontSize: 12, color: '#9ca3af' }]}>
          Updated:
        </Text>
      </View>
    </Pressable>
  );

  const renderTransactionItem = ({ item }: { item: StockTransaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={[
          styles.transactionType, 
          { backgroundColor: item.type === 'in' ? '#dcfce7' : '#fee2e2' }
        ]}>
          <IconSymbol 
            name={item.type === 'in' ? 'arrow.down.circle.fill' : 'arrow.up.circle.fill'} 
            size={20} 
            color={item.type === 'in' ? '#16a34a' : '#dc2626'} 
          />
          <Text style={[
            styles.transactionTypeText,
            { color: item.type === 'in' ? '#16a34a' : '#dc2626' }
          ]}>
            {item.type === 'in' ? 'Stock In' : 'Stock Out'}
          </Text>
        </View>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      
      <Text style={styles.transactionItemName}>{item.itemName}</Text>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionQuantity}>Quantity: {item.quantity}</Text>
        <Text style={styles.transactionReason}>{item.reason}</Text>
        <Text style={styles.transactionReference}>Ref: {item.reference}</Text>
      </View>
    </View>
  );

  return (
    <ParallaxScrollView>
      <ThemedView style={styles.container}>
        <Header title="Stock Management" subtitle="Monitor and manage your inventory" />

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <Pressable 
            style={[styles.tab, activeTab === 'list' && styles.activeTab]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
              Stock List
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
              Stock History
            </Text>
          </Pressable>
        </View>

        {activeTab === 'list' && (
          <>
            {/* Search and Add Button */}
            <View style={styles.actionRow}>
              <View style={styles.searchContainer}>
                <IconSymbol name="magnifyingglass" size={20} color="#6b7280" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search stock..."
                  placeholderTextColor="#9ca3af"
                  value={searchText}
                  onChangeText={(e) => {
                    setSearchText(e);
                  }}
                />
              </View>
            </View>

            {/* Stock List */}
            <FlatList
              data={stockList}
              renderItem={renderStockItem}
              style={styles.stockList}
              scrollEnabled={false}
            />
          </>
        )}

        {activeTab === 'history' && (
          <FlatList
            data={transactionData}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            style={styles.transactionList}
            scrollEnabled={false}
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
                      value={formData.minStock?.toString()}
                      onChangeText={(text) => setFormData({...formData, minStock: parseInt(text) || 0})}
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
                <Pressable onPress={() => setShowDetailModal(false)}>
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
                    <Text style={styles.detailValue}>{selectedItem.currentStock}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedItem.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(selectedItem.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Updated</Text>
                    <Text style={styles.detailValue}>{selectedItem.lastUpdated}</Text>
                  </View>
                </ScrollView>
              )}

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setShowDetailModal(false)}>
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
    fontSize: 16,
    color: '#374151',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
});