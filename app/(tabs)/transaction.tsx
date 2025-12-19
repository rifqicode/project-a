import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TransactionInterface } from '@/db/models/transaction';
import { TransactionService } from '@/db/services/transaction';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

type DateFilter = 'today' | 'week' | 'all' | 'custom';


export default function TransactionScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customStartDate, setCustomStartDate] = useState('2025-12-01');
  const [customEndDate, setCustomEndDate] = useState('2025-12-18');
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date(2025, 11, 1)); // December 1, 2025
  const [endDate, setEndDate] = useState(new Date()); // Today

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      let data: TransactionInterface[];

      const today = getCurrentDate();
      
      switch (dateFilter) {
        case 'today':
          data = await TransactionService.getTransactionsByDateRange(today, today);
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const weekAgoStr = weekAgo.toISOString().split('T')[0];
          data = await TransactionService.getTransactionsByDateRange(weekAgoStr, today);
          break;
        case 'custom':
          data = await TransactionService.getTransactionsByDateRange(customStartDate, customEndDate);
          break;
        default: // 'all'
          data = await TransactionService.getAllTransactions();
          break;
      }

      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customStartDate, customEndDate]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  }, [loadTransactions]);

  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const handleTransactionPress = (transactionId: number) => {
    router.push(`/transaction/${transactionId}`);
  };

  const handleAddTransaction = () => {
    router.push('/transaction/create');
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleStartDateConfirm = (date: Date) => {
    setStartDate(date);
    setCustomStartDate(date.toISOString().split('T')[0]);
    setShowStartDatePicker(false);
  };

  const handleEndDateConfirm = (date: Date) => {
    setEndDate(date);
    setCustomEndDate(date.toISOString().split('T')[0]);
    setShowEndDatePicker(false);
  };

  const handleDateSelect = (mode: 'start' | 'end', daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const dateString = date.toISOString().split('T')[0];
    
    if (mode === 'start') {
      setStartDate(date);
      setCustomStartDate(dateString);
    } else {
      setEndDate(date);
      setCustomEndDate(dateString);
    }
  };

  const validateAndApplyDateFilter = () => {
    if (startDate > endDate) {
      Alert.alert('Invalid Range', 'Start date must be before end date');
      return;
    }

    setDateFilter('custom');
    setShowCustomDateModal(false);
  };

  const renderTransactionItem = ({ item }: { item: TransactionInterface }) => (
    <Pressable 
      style={styles.transactionCard}
      onPress={() => handleTransactionPress(item.id)}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionLeft}>
          <View style={[
            styles.transactionTypeIcon,
            { backgroundColor: '#3b82f620' }
          ]}>
            <IconSymbol
              name="cart"
              size={20}
              color="#3b82f6"
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionId}>{item.transactionNumber}</Text>
            <Text style={styles.transactionProduct}>{item.total_quantity} items</Text>
            <Text style={styles.transactionSku}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: '#10b981' }
          ]}>
            {formatCurrency(item.total_price)}
          </Text>
          <Text style={styles.transactionTime}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.transactionMetric}>
          <Text style={styles.metricLabel}>Quantity</Text>
          <Text style={styles.metricValue}>
            {item.total_quantity}
          </Text>
        </View>
        <View style={styles.transactionMetric}>
          <Text style={styles.metricLabel}>Total Amount</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(item.total_price)}
          </Text>
        </View>
        <View style={styles.transactionMetric}>
          <Text style={styles.metricLabel}>Type</Text>
          <Text style={[
            styles.metricValue,
            { color: '#10b981' }
          ]}>
            Sale
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ParallaxScrollView>
      <ThemedView style={styles.container}>
          <Header title="Transactions" subtitle="Manage your business transactions" />

          {/* Add Transaction Button */}
          <Pressable style={styles.addTransactionButton} onPress={handleAddTransaction}>
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
                <Text style={styles.summaryCount}>{transactions.length} transactions</Text>
              </View>
            </Card>
          </View>

          {/* Transaction List */}
          <View style={styles.transactionList}>
            <Text style={styles.listTitle}>Transaction History</Text>
            {loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.emptyStateText}>Loading transactions...</Text>
              </View>
            ) : transactions.length > 0 ? (
              <FlatList
                data={transactions}
                renderItem={renderTransactionItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
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
                {/* Start Date */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  
                  {/* Quick Select Buttons */}
                  <View style={styles.quickDateButtons}>
                    <Pressable 
                      style={styles.quickDateButton}
                      onPress={() => handleDateSelect('start', 7)}
                    >
                      <Text style={styles.quickDateButtonText}>7 days ago</Text>
                    </Pressable>
                    <Pressable 
                      style={styles.quickDateButton}
                      onPress={() => handleDateSelect('start', 30)}
                    >
                      <Text style={styles.quickDateButtonText}>30 days ago</Text>
                    </Pressable>
                    <Pressable 
                      style={styles.quickDateButton}
                      onPress={() => handleDateSelect('start', 90)}
                    >
                      <Text style={styles.quickDateButtonText}>90 days ago</Text>
                    </Pressable>
                  </View>

                  {/* Date Display Button */}
                  <Pressable 
                    style={styles.datePickerButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <IconSymbol name="calendar" size={20} color="#3b82f6" />
                    <Text style={styles.datePickerButtonText}>
                      {formatDateForDisplay(customStartDate)}
                    </Text>
                    <IconSymbol name="chevron.down" size={16} color="#9ca3af" />
                  </Pressable>
                </View>

                {/* End Date */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  
                  {/* Quick Select Buttons */}
                  <View style={styles.quickDateButtons}>
                    <Pressable 
                      style={styles.quickDateButton}
                      onPress={() => handleDateSelect('end', 0)}
                    >
                      <Text style={styles.quickDateButtonText}>Today</Text>
                    </Pressable>
                    <Pressable 
                      style={styles.quickDateButton}
                      onPress={() => handleDateSelect('end', 1)}
                    >
                      <Text style={styles.quickDateButtonText}>Yesterday</Text>
                    </Pressable>
                    <Pressable 
                      style={styles.quickDateButton}
                      onPress={() => handleDateSelect('end', 7)}
                    >
                      <Text style={styles.quickDateButtonText}>7 days ago</Text>
                    </Pressable>
                  </View>

                  {/* Date Display Button */}
                  <Pressable 
                    style={styles.datePickerButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <IconSymbol name="calendar" size={20} color="#3b82f6" />
                    <Text style={styles.datePickerButtonText}>
                      {formatDateForDisplay(customEndDate)}
                    </Text>
                    <IconSymbol name="chevron.down" size={16} color="#9ca3af" />
                  </Pressable>
                </View>

                {/* Date Range Summary */}
                <View style={styles.dateRangeInfo}>
                  <IconSymbol name="info.circle" size={16} color="#6b7280" />
                  <Text style={styles.dateRangeInfoText}>
                    {startDate <= endDate 
                      ? `Selected range: ${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days`
                      : 'Start date must be before end date'}
                  </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setShowCustomDateModal(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={styles.saveButton} 
                  onPress={validateAndApplyDateFilter}
                >
                  <Text style={styles.saveButtonText}>Apply Filter</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Start Date Picker Modal */}
        <Modal visible={showStartDatePicker} animationType="slide" transparent>
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Start Date</Text>
                <Pressable onPress={() => setShowStartDatePicker(false)}>
                  <IconSymbol name="xmark" size={24} color="#6b7280" />
                </Pressable>
              </View>

              <ScrollView style={styles.dateScrollView}>
                {/* Year Selector */}
                <View style={styles.dateSection}>
                  <Text style={styles.dateSectionLabel}>Year</Text>
                  <View style={styles.dateOptionsGrid}>
                    {[2024, 2025, 2026].map((year) => (
                      <Pressable
                        key={year}
                        style={[
                          styles.dateOptionButton,
                          startDate.getFullYear() === year && styles.dateOptionButtonActive
                        ]}
                        onPress={() => {
                          const newDate = new Date(startDate);
                          newDate.setFullYear(year);
                          setStartDate(newDate);
                        }}
                      >
                        <Text style={[
                          styles.dateOptionText,
                          startDate.getFullYear() === year && styles.dateOptionTextActive
                        ]}>
                          {year}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Month Selector */}
                <View style={styles.dateSection}>
                  <Text style={styles.dateSectionLabel}>Month</Text>
                  <View style={styles.dateOptionsGrid}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                      <Pressable
                        key={month}
                        style={[
                          styles.dateOptionButton,
                          startDate.getMonth() === index && styles.dateOptionButtonActive
                        ]}
                        onPress={() => {
                          const newDate = new Date(startDate);
                          newDate.setMonth(index);
                          setStartDate(newDate);
                        }}
                      >
                        <Text style={[
                          styles.dateOptionText,
                          startDate.getMonth() === index && styles.dateOptionTextActive
                        ]}>
                          {month}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Day Selector */}
                <View style={styles.dateSection}>
                  <Text style={styles.dateSectionLabel}>Day</Text>
                  <View style={styles.dateOptionsGrid}>
                    {Array.from({ length: new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((day) => (
                      <Pressable
                        key={day}
                        style={[
                          styles.dateOptionButton,
                          startDate.getDate() === day && styles.dateOptionButtonActive
                        ]}
                        onPress={() => {
                          const newDate = new Date(startDate);
                          newDate.setDate(day);
                          setStartDate(newDate);
                        }}
                      >
                        <Text style={[
                          styles.dateOptionText,
                          startDate.getDate() === day && styles.dateOptionTextActive
                        ]}>
                          {day}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setShowStartDatePicker(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={styles.saveButton} 
                  onPress={() => handleStartDateConfirm(startDate)}
                >
                  <Text style={styles.saveButtonText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* End Date Picker Modal */}
        <Modal visible={showEndDatePicker} animationType="slide" transparent>
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.datePickerModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select End Date</Text>
                <Pressable onPress={() => setShowEndDatePicker(false)}>
                  <IconSymbol name="xmark" size={24} color="#6b7280" />
                </Pressable>
              </View>

              <ScrollView style={styles.dateScrollView}>
                {/* Year Selector */}
                <View style={styles.dateSection}>
                  <Text style={styles.dateSectionLabel}>Year</Text>
                  <View style={styles.dateOptionsGrid}>
                    {[2024, 2025, 2026].map((year) => (
                      <Pressable
                        key={year}
                        style={[
                          styles.dateOptionButton,
                          endDate.getFullYear() === year && styles.dateOptionButtonActive
                        ]}
                        onPress={() => {
                          const newDate = new Date(endDate);
                          newDate.setFullYear(year);
                          setEndDate(newDate);
                        }}
                      >
                        <Text style={[
                          styles.dateOptionText,
                          endDate.getFullYear() === year && styles.dateOptionTextActive
                        ]}>
                          {year}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Month Selector */}
                <View style={styles.dateSection}>
                  <Text style={styles.dateSectionLabel}>Month</Text>
                  <View style={styles.dateOptionsGrid}>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                      <Pressable
                        key={month}
                        style={[
                          styles.dateOptionButton,
                          endDate.getMonth() === index && styles.dateOptionButtonActive
                        ]}
                        onPress={() => {
                          const newDate = new Date(endDate);
                          newDate.setMonth(index);
                          setEndDate(newDate);
                        }}
                      >
                        <Text style={[
                          styles.dateOptionText,
                          endDate.getMonth() === index && styles.dateOptionTextActive
                        ]}>
                          {month}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Day Selector */}
                <View style={styles.dateSection}>
                  <Text style={styles.dateSectionLabel}>Day</Text>
                  <View style={styles.dateOptionsGrid}>
                    {Array.from({ length: new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((day) => (
                      <Pressable
                        key={day}
                        style={[
                          styles.dateOptionButton,
                          endDate.getDate() === day && styles.dateOptionButtonActive
                        ]}
                        onPress={() => {
                          const newDate = new Date(endDate);
                          newDate.setDate(day);
                          setEndDate(newDate);
                        }}
                      >
                        <Text style={[
                          styles.dateOptionText,
                          endDate.getDate() === day && styles.dateOptionTextActive
                        ]}>
                          {day}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setShowEndDatePicker(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={styles.saveButton} 
                  onPress={() => handleEndDateConfirm(endDate)}
                >
                  <Text style={styles.saveButtonText}>Confirm</Text>
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
  dateRangeForm: {
    paddingVertical: 10,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  quickDateButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickDateButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  datePreview: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 4,
    fontStyle: 'italic',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  datePickerButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  dateRangeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  dateRangeInfoText: {
    fontSize: 12,
    color: '#6b7280',
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
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  dateScrollView: {
    maxHeight: 400,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateSectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  dateOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateOptionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 60,
    alignItems: 'center',
  },
  dateOptionButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dateOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  dateOptionTextActive: {
    color: '#ffffff',
  },
});