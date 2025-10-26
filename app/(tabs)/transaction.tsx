import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
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

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface Transaction {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  productSku: string;
  type: 'sale' | 'purchase' | 'adjustment';
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: string;
  time: string;
  notes: string;
  customer?: string;
  supplier?: string;
}

type DateFilter = 'today' | 'week' | 'all' | 'custom';

const products: Product[] = [
  { id: '1', name: 'Wireless Mouse', sku: 'WM-001', price: 29.99, stock: 45 },
  { id: '2', name: 'USB Cable', sku: 'UC-002', price: 12.99, stock: 8 },
  { id: '3', name: 'Keyboard', sku: 'KB-003', price: 59.99, stock: 23 },
  { id: '4', name: 'Monitor Stand', sku: 'MS-004', price: 39.99, stock: 5 },
  { id: '5', name: 'Laptop Sleeve', sku: 'LS-005', price: 24.99, stock: 67 }
];

const sampleTransactions: Transaction[] = [
  {
    id: '1',
    transactionId: 'TXN-20251022-001',
    productId: '1',
    productName: 'Wireless Mouse',
    productSku: 'WM-001',
    type: 'sale',
    quantity: 2,
    unitPrice: 29.99,
    totalAmount: 59.98,
    date: '2025-10-22',
    time: '14:30',
    notes: 'Online order',
    customer: 'John Doe'
  },
  {
    id: '2',
    transactionId: 'TXN-20251022-002',
    productId: '2',
    productName: 'USB Cable',
    productSku: 'UC-002',
    type: 'purchase',
    quantity: 50,
    unitPrice: 8.50,
    totalAmount: 425.00,
    date: '2025-10-22',
    time: '10:15',
    notes: 'Bulk purchase',
    supplier: 'Tech Supplies Inc.'
  },
  {
    id: '3',
    transactionId: 'TXN-20251021-001',
    productId: '3',
    productName: 'Keyboard',
    productSku: 'KB-003',
    type: 'sale',
    quantity: 1,
    unitPrice: 59.99,
    totalAmount: 59.99,
    date: '2025-10-21',
    time: '16:45',
    notes: 'Walk-in customer',
    customer: 'Jane Smith'
  },
  {
    id: '4',
    transactionId: 'TXN-20251020-001',
    productId: '4',
    productName: 'Monitor Stand',
    productSku: 'MS-004',
    type: 'adjustment',
    quantity: -2,
    unitPrice: 0,
    totalAmount: 0,
    date: '2025-10-20',
    time: '09:00',
    notes: 'Damaged items removed'
  },
  {
    id: '5',
    transactionId: 'TXN-20251019-001',
    productId: '5',
    productName: 'Laptop Sleeve',
    productSku: 'LS-005',
    type: 'sale',
    quantity: 3,
    unitPrice: 24.99,
    totalAmount: 74.97,
    date: '2025-10-19',
    time: '13:20',
    notes: 'Bulk order discount',
    customer: 'ABC Company'
  }
];

export default function TransactionScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customStartDate, setCustomStartDate] = useState('2025-10-01');
  const [customEndDate, setCustomEndDate] = useState('2025-10-22');
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: 'sale' as 'sale' | 'purchase' | 'adjustment',
    quantity: '',
    unitPrice: '',
    notes: '',
    customer: '',
    supplier: ''
  });

  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const filterTransactions = (transactions: Transaction[]) => {
    const today = getCurrentDate();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    switch (dateFilter) {
      case 'today':
        return transactions.filter(t => t.date === today);
      case 'week':
        return transactions.filter(t => t.date >= weekAgoStr);
      case 'custom':
        return transactions.filter(t => t.date >= customStartDate && t.date <= customEndDate);
      default:
        return transactions;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return '#10b981';
      case 'purchase': return '#3b82f6';
      case 'adjustment': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'sale': return 'cart';
      case 'purchase': return 'bag';
      case 'adjustment': return 'wrench.and.screwdriver';
      default: return 'doc';
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setTransactionForm(prev => ({
      ...prev,
      unitPrice: product.price.toString()
    }));
    setShowProductModal(false);
  };

  const handleAddTransaction = () => {
    if (!selectedProduct || !transactionForm.quantity) {
      Alert.alert('Error', 'Please select a product and enter quantity');
      return;
    }

    const quantity = parseInt(transactionForm.quantity);
    const unitPrice = parseFloat(transactionForm.unitPrice) || selectedProduct.price;
    const totalAmount = Math.abs(quantity * unitPrice);

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      transactionId: `TXN-${getCurrentDate().replace(/-/g, '')}-${String(sampleTransactions.length + 1).padStart(3, '0')}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productSku: selectedProduct.sku,
      type: transactionForm.type,
      quantity: transactionForm.type === 'adjustment' ? quantity : Math.abs(quantity),
      unitPrice,
      totalAmount: transactionForm.type === 'adjustment' ? 0 : totalAmount,
      date: getCurrentDate(),
      time: getCurrentTime(),
      notes: transactionForm.notes,
      ...(transactionForm.type === 'sale' && { customer: transactionForm.customer }),
      ...(transactionForm.type === 'purchase' && { supplier: transactionForm.supplier })
    };

    Alert.alert('Success', `Transaction ${newTransaction.transactionId} added successfully!`);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setTransactionForm({
      type: 'sale',
      quantity: '',
      unitPrice: '',
      notes: '',
      customer: '',
      supplier: ''
    });
  };

  const filteredTransactions = filterTransactions(sampleTransactions);

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionLeft}>
          <View style={[
            styles.transactionTypeIcon,
            { backgroundColor: `${getTransactionTypeColor(item.type)}20` }
          ]}>
            <IconSymbol
              name={getTransactionTypeIcon(item.type)}
              size={20}
              color={getTransactionTypeColor(item.type)}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionId}>{item.transactionId}</Text>
            <Text style={styles.transactionProduct}>{item.productName}</Text>
            <Text style={styles.transactionSku}>SKU: {item.productSku}</Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: item.type === 'purchase' ? '#ef4444' : '#10b981' }
          ]}>
            {item.type === 'adjustment' ? 'Adj.' : 
             item.type === 'purchase' ? `-$${item.totalAmount.toFixed(2)}` :
             `+$${item.totalAmount.toFixed(2)}`}
          </Text>
          <Text style={styles.transactionTime}>{item.time}</Text>
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.transactionMetric}>
          <Text style={styles.metricLabel}>Quantity</Text>
          <Text style={styles.metricValue}>
            {item.type === 'adjustment' && item.quantity < 0 ? item.quantity : item.quantity}
          </Text>
        </View>
        <View style={styles.transactionMetric}>
          <Text style={styles.metricLabel}>Unit Price</Text>
          <Text style={styles.metricValue}>
            {item.type === 'adjustment' ? 'N/A' : `$${item.unitPrice.toFixed(2)}`}
          </Text>
        </View>
        <View style={styles.transactionMetric}>
          <Text style={styles.metricLabel}>Type</Text>
          <Text style={[
            styles.metricValue,
            { color: getTransactionTypeColor(item.type) }
          ]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
      </View>

      {item.notes && (
        <Text style={styles.transactionNotes}>Note: {item.notes}</Text>
      )}

      {item.customer && (
        <Text style={styles.transactionExtra}>Customer: {item.customer}</Text>
      )}

      {item.supplier && (
        <Text style={styles.transactionExtra}>Supplier: {item.supplier}</Text>
      )}
    </View>
  );

  return (
    <ParallaxScrollView>
      <ThemedView style={styles.container}>
          <Header title="Transactions" subtitle="Manage your business transactions" />

          {/* Add Transaction Button */}
          <Pressable style={styles.addTransactionButton} onPress={() => setShowAddModal(true)}>
            <IconSymbol name="plus.circle.fill" size={24} color="#ffffff" />
            <Text style={styles.addTransactionText}>Add New Transaction</Text>
          </Pressable>

          {/* Date Filter Tabs */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>Filter by Date</Text>
            <View style={styles.filterTabs}>
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: '7 Days' },
                { key: 'all', label: 'All' },
                { key: 'custom', label: 'Custom' }
              ].map((filter) => (
                <Pressable
                  key={filter.key}
                  style={[
                    styles.filterTab,
                    dateFilter === filter.key && styles.activeFilterTab
                  ]}
                  onPress={() => {
                    if (filter.key === 'custom') {
                      setShowCustomDateModal(true);
                    } else {
                      setDateFilter(filter.key as DateFilter);
                    }
                  }}
                >
                  <Text style={[
                    styles.filterTabText,
                    dateFilter === filter.key && styles.activeFilterTabText
                  ]}>
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Transaction Summary */}
          <View style={styles.summaryContainer}>
            <Card>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>
                  {dateFilter === 'today' ? 'Today\'s' :
                  dateFilter === 'week' ? 'Last 7 Days' :
                  dateFilter === 'custom' ? 'Custom Range' : 'All'} Transactions
                </Text>
                <Text style={styles.summaryCount}>{filteredTransactions.length} transactions</Text>
              </View>
            </Card>
          </View>

          {/* Transaction List */}
          <View style={styles.transactionList}>
            <Text style={styles.listTitle}>Transaction History</Text>
            {filteredTransactions.length > 0 ? (
              <FlatList
                data={filteredTransactions}
                renderItem={renderTransactionItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <IconSymbol name="doc.text" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No transactions found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {dateFilter === 'today' ? 'No transactions recorded today' :
                  dateFilter === 'week' ? 'No transactions in the last 7 days' :
                  'Try adjusting your date filter'}
                </Text>
              </View>
            )}
          </View>

        {/* Add Transaction Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Transaction</Text>
                <Pressable onPress={() => { setShowAddModal(false); resetForm(); }}>
                  <IconSymbol name="xmark" size={24} color="#6b7280" />
                </Pressable>
              </View>

              <ScrollView style={styles.formContainer}>
                {/* Transaction Type */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Transaction Type</Text>
                  <View style={styles.typeButtons}>
                    {[
                      { key: 'sale', label: 'Sale', icon: 'cart' },
                      { key: 'purchase', label: 'Purchase', icon: 'bag' },
                      { key: 'adjustment', label: 'Adjustment', icon: 'wrench.and.screwdriver' }
                    ].map((type) => (
                      <Pressable
                        key={type.key}
                        style={[
                          styles.typeButton,
                          transactionForm.type === type.key && styles.activeTypeButton
                        ]}
                        onPress={() => setTransactionForm(prev => ({ ...prev, type: type.key as any }))}
                      >
                        <IconSymbol
                          name={type.icon}
                          size={20}
                          color={transactionForm.type === type.key ? '#ffffff' : '#6b7280'}
                        />
                        <Text style={[
                          styles.typeButtonText,
                          transactionForm.type === type.key && styles.activeTypeButtonText
                        ]}>
                          {type.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Product Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Select Product</Text>
                  <Pressable 
                    style={styles.productSelector}
                    onPress={() => setShowProductModal(true)}
                  >
                    {selectedProduct ? (
                      <View style={styles.selectedProductInfo}>
                        <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
                        <Text style={styles.selectedProductSku}>SKU: {selectedProduct.sku}</Text>
                      </View>
                    ) : (
                      <Text style={styles.productSelectorPlaceholder}>Tap to select product</Text>
                    )}
                    <IconSymbol name="chevron.down" size={16} color="#9ca3af" />
                  </Pressable>
                </View>

                {/* Quantity and Price */}
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Quantity</Text>
                    <TextInput
                      style={styles.textInput}
                      value={transactionForm.quantity}
                      onChangeText={(text) => setTransactionForm(prev => ({ ...prev, quantity: text }))}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Unit Price ($)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={transactionForm.unitPrice}
                      onChangeText={(text) => setTransactionForm(prev => ({ ...prev, unitPrice: text }))}
                      placeholder="0.00"
                      keyboardType="numeric"
                      editable={transactionForm.type !== 'adjustment'}
                    />
                  </View>
                </View>

                {/* Customer/Supplier */}
                {transactionForm.type === 'sale' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Customer (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={transactionForm.customer}
                      onChangeText={(text) => setTransactionForm(prev => ({ ...prev, customer: text }))}
                      placeholder="Enter customer name"
                    />
                  </View>
                )}

                {transactionForm.type === 'purchase' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Supplier (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      value={transactionForm.supplier}
                      onChangeText={(text) => setTransactionForm(prev => ({ ...prev, supplier: text }))}
                      placeholder="Enter supplier name"
                    />
                  </View>
                )}

                {/* Notes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    value={transactionForm.notes}
                    onChangeText={(text) => setTransactionForm(prev => ({ ...prev, notes: text }))}
                    placeholder="Add transaction notes..."
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Total Amount Display */}
                {selectedProduct && transactionForm.quantity && transactionForm.type !== 'adjustment' && (
                  <View style={styles.totalAmount}>
                    <Text style={styles.totalAmountLabel}>Total Amount:</Text>
                    <Text style={styles.totalAmountValue}>
                      ${(parseInt(transactionForm.quantity) * parseFloat(transactionForm.unitPrice || selectedProduct.price.toString())).toFixed(2)}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => { setShowAddModal(false); resetForm(); }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={handleAddTransaction}>
                  <Text style={styles.saveButtonText}>Add Transaction</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Product Selection Modal */}
        <Modal visible={showProductModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Product</Text>
                <Pressable onPress={() => setShowProductModal(false)}>
                  <IconSymbol name="xmark" size={24} color="#6b7280" />
                </Pressable>
              </View>
              
              <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.productItem}
                    onPress={() => handleProductSelect(item)}
                  >
                    <View style={styles.productItemInfo}>
                      <Text style={styles.productItemName}>{item.name}</Text>
                      <Text style={styles.productItemSku}>SKU: {item.sku}</Text>
                      <Text style={styles.productItemStock}>Stock: {item.stock} units</Text>
                    </View>
                    <View style={styles.productItemRight}>
                      <Text style={styles.productItemPrice}>${item.price.toFixed(2)}</Text>
                      <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
                    </View>
                  </Pressable>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Custom Date Range Modal */}
        <Modal visible={showCustomDateModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Custom Date Range</Text>
                <Pressable onPress={() => setShowCustomDateModal(false)}>
                  <IconSymbol name="xmark" size={24} color="#6b7280" />
                </Pressable>
              </View>

              <View style={styles.dateRangeForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customStartDate}
                    onChangeText={setCustomStartDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={customEndDate}
                    onChangeText={setCustomEndDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setShowCustomDateModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={styles.saveButton} 
                  onPress={() => {
                    setDateFilter('custom');
                    setShowCustomDateModal(false);
                  }}
                >
                  <Text style={styles.saveButtonText}>Apply Filter</Text>
                </Pressable>
              </View>
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
    backgroundColor: '#f9fafb',
    marginTop: 16
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addTransactionButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  addTransactionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    marginTop: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeFilterTab: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterTabText: {
    color: '#ffffff',
  },
  summaryContainer: {
    marginTop: 20,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  transactionList: {
    marginTop: 24,
    paddingBottom: 100,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  transactionTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  transactionProduct: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  transactionSku: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  transactionNotes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  transactionExtra: {
    fontSize: 14,
    color: '#374151',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
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
    maxHeight: '90%',
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
    maxHeight: 500,
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
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  activeTypeButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTypeButtonText: {
    color: '#ffffff',
  },
  productSelector: {
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
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedProductSku: {
    fontSize: 14,
    color: '#6b7280',
  },
  productSelectorPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
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
  productItemInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  productItemSku: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  productItemStock: {
    fontSize: 12,
    color: '#9ca3af',
  },
  productItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  totalAmount: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalAmountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  totalAmountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  dateRangeForm: {
    paddingVertical: 10,
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
});