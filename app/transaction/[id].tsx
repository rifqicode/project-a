import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TransactionInterface } from '@/db/models/transaction';
import { TransactionDetailInterface } from '@/db/models/transaction_detail';
import { TransactionService } from '@/db/services/transaction';
import { BorderRadius, Colors, FontSizes, FontWeights, Shadows, Spacing } from '@/styles';

interface TransactionWithDetails extends TransactionInterface {
  details: (TransactionDetailInterface & { productName: string; productIcon: string })[];
}

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactionId = parseInt(id);

  const [transaction, setTransaction] = useState<TransactionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTransactionData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await TransactionService.getTransactionById(transactionId);
      if (data) {
        setTransaction(data);
      } else {
        Alert.alert('Error', 'Transaction not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
      Alert.alert('Error', 'Failed to load transaction details');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [transactionId, router]);

  useEffect(() => {
    loadTransactionData();
  }, [loadTransactionData]);

  const handleDelete = () => {
    if (!transaction) return;

    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete transaction ${transaction.transactionNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await TransactionService.deleteTransaction(transaction.id);
              Alert.alert('Success', 'Transaction deleted successfully!', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (loading) {
    return (
      <ParallaxScrollView>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ParallaxScrollView>
    );
  }

  if (!transaction) {
    return null;
  }

  return (
    <ParallaxScrollView>
      <View style={{ flex: 1, width: '100%' }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={{...styles.backButton, backgroundColor: Colors.white}}>
            <IconSymbol name="chevron.left" size={20} color={Colors.black} />
          </Pressable>
          <Text style={styles.headerTitle}>Transaction Detail</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Transaction Number & Date Header */}
          <View style={styles.transactionHeader}>
            <View style={styles.transactionHeaderInfo}>
              <Text style={styles.transactionNumber}>{transaction.transactionNumber}</Text>
              <Text style={styles.transactionDate}>{formatDate(transaction.createdAt)}</Text>
            </View>
          </View>

          {/* Products Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Products ({transaction.details.length})
            </Text>
            {transaction.details.map((detail, index) => (
              <View key={detail.id} style={styles.productItem}>
                <View style={styles.productIcon}>
                  <Text style={styles.productIconText}>{detail.productIcon || '🍔'}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{detail.productName}</Text>
                  <Text style={styles.productPrice}>
                    {formatCurrency(detail.amount)} × {detail.quantity}
                  </Text>
                </View>
                <View style={styles.productTotal}>
                  <Text style={styles.productTotalValue}>
                    {formatCurrency(detail.total)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          {/* Total Summary Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.totalContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{formatCurrency(transaction.total_amount)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Quantity</Text>
                <Text style={styles.totalValue}>{transaction.total_quantity}</Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabelFinal}>Total Price</Text>
                <Text style={styles.totalValueFinal}>{formatCurrency(transaction.total_price)}</Text>
              </View>
            </View>
          </View>
          {/* Delete Action */}
          <View style={styles.actionSection}>
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <IconSymbol name="trash" size={20} color={Colors.error} />
              <Text style={styles.deleteButtonText}>Delete Transaction</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.massive,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.primary,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    marginLeft: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.large,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 80,
  },
  content: {
    flex: 1,
    padding: Spacing.xs,
    paddingBottom: 100,
  },
  transactionHeader: {
    alignContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  transactionHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  transactionHeaderInfo: {
    flex: 1,
  },
  transactionNumber: {
    fontSize: FontSizes.h3,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  transactionDate: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.base,
  },
  statValue: {
    fontSize: FontSizes.h3,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.xs,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  productIconText: {
    fontSize: FontSizes.h2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  productPrice: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  productTotal: {
    alignItems: 'flex-end',
  },
  productTotalValue: {
    fontSize: FontSizes.large,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  totalContainer: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  totalLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
  },
  totalDivider: {
    height: 2,
    backgroundColor: Colors.primary,
    marginVertical: Spacing.sm,
  },
  totalLabelFinal: {
    fontSize: FontSizes.h3,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  totalValueFinal: {
    fontSize: FontSizes.h2,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  actionSection: {
    marginTop: Spacing.xs,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.error,
    ...Shadows.sm,
  },
  deleteButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.error,
  },
});
