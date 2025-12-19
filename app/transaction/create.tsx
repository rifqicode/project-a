import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProductInterface } from '@/db/models/product';
import { ProductService } from '@/db/services/product';
import { TransactionService } from '@/db/services/transaction';
import { BorderRadius, Colors, CommonStyles, FontSizes, FontWeights, Shadows, Spacing } from '@/styles';

interface SelectedProduct extends ProductInterface {
  selectedQuantity: number;
  subtotal: number;
}

export default function CreateTransactionScreen() {
  const router = useRouter();
  const [transactionNumber, setTransactionNumber] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productList, setProductList] = useState<ProductInterface[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    generateTransactionNumber();
  }, []);

  const generateTransactionNumber = async () => {
    const number = await TransactionService.generateTransactionNumber();
    setTransactionNumber(number);
  };

  const loadProducts = useCallback(async () => {
    try {
      const products = await ProductService.getAllProducts({
        searchQuery: searchText,
        perPage: 100,
        page: 0,
      });
      setProductList(products);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    }
  }, [searchText]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleAddProduct = (product: ProductInterface) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      Alert.alert('Info', 'Product already added. You can adjust quantity below.');
      setShowProductModal(false);
      return;
    }

    const newProduct: SelectedProduct = {
      ...product,
      selectedQuantity: 1,
      subtotal: product.price * 1,
    };
    setSelectedProducts([...selectedProducts, newProduct]);
    setShowProductModal(false);
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;

    setSelectedProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, selectedQuantity: quantity, subtotal: p.price * quantity }
          : p
      )
    );
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, p) => sum + p.subtotal, 0);
  };

  const calculateTotalQuantity = () => {
    return selectedProducts.reduce((sum, p) => sum + p.selectedQuantity, 0);
  };

  const handleCreateTransaction = async () => {
    if (selectedProducts.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return;
    }

    Alert.alert(
      'Confirm Transaction',
      `Create transaction with ${selectedProducts.length} products for ${formatCurrency(calculateTotal())}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              const products = selectedProducts.map(p => ({
                ProductId: p.id,
                quantity: p.selectedQuantity,
                amount: p.price,
              }));

              await TransactionService.createTransaction({ products });
              Alert.alert('Success', 'Transaction created successfully!', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error('Error creating transaction:', error);
              Alert.alert('Error', 'Failed to create transaction');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const renderProductItem = ({ item }: { item: ProductInterface }) => (
    <Pressable style={styles.productItem} onPress={() => handleAddProduct(item)}>
      <View style={styles.productIcon}>
        <Text style={styles.productIconText}>{item.icon || '🍔'}</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>{item.sku}</Text>
        <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
      </View>
      <IconSymbol name="plus.circle" size={24} color={Colors.primary} />
    </Pressable>
  );

  const renderSelectedProduct = ({ item }: { item: SelectedProduct }) => (
    <View style={styles.selectedProductCard}>
      <View style={styles.selectedProductHeader}>
        <View style={styles.selectedProductIcon}>
          <Text style={styles.selectedProductIconText}>{item.icon || '🍔'}</Text>
        </View>
        <View style={styles.selectedProductInfo}>
          <Text style={styles.selectedProductName}>{item.name}</Text>
          <Text style={styles.selectedProductPrice}>{formatCurrency(item.price)} / item</Text>
        </View>
        <Pressable onPress={() => handleRemoveProduct(item.id)}>
          <IconSymbol name="trash" size={20} color={Colors.error} />
        </Pressable>
      </View>

      <View style={styles.quantityControl}>
        <Pressable
          style={styles.quantityButton}
          onPress={() => handleUpdateQuantity(item.id, item.selectedQuantity - 1)}
        >
          <IconSymbol name="minus" size={20} color={Colors.primary} />
        </Pressable>
        <TextInput
          style={styles.quantityInput}
          value={item.selectedQuantity.toString()}
          onChangeText={(text) => {
            const qty = parseInt(text) || 1;
            handleUpdateQuantity(item.id, qty);
          }}
          keyboardType="numeric"
        />
        <Pressable
          style={styles.quantityButton}
          onPress={() => handleUpdateQuantity(item.id, item.selectedQuantity + 1)}
        >
          <IconSymbol name="plus" size={20} color={Colors.primary} />
        </Pressable>
        <View style={styles.subtotalContainer}>
          <Text style={styles.subtotalLabel}>Subtotal:</Text>
          <Text style={styles.subtotalValue}>{formatCurrency(item.subtotal)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ParallaxScrollView>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={20} color={Colors.black} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Transaction</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* Transaction Number */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Transaction Number</Text>
            <Text style={styles.transactionNumber}>{transactionNumber}</Text>
          </Card>

          {/* Selected Products */}
          <Card style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Selected Products ({selectedProducts.length})</Text>
              <Pressable style={styles.addButton} onPress={() => setShowProductModal(true)}>
                <IconSymbol name="plus" size={16} color={Colors.white} />
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            {selectedProducts.length === 0 ? (
              <View style={styles.emptyProducts}>
                <IconSymbol name="cart" size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyProductsText}>No products added yet</Text>
                <Text style={styles.emptyProductsSubtext}>Tap &quot;Add&quot; to select products</Text>
              </View>
            ) : (
              <FlatList
                data={selectedProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderSelectedProduct}
                scrollEnabled={false}
              />
            )}
          </Card>

          {/* Total */}
          <Card style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Items:</Text>
              <Text style={styles.totalValue}>{calculateTotalQuantity()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>{formatCurrency(calculateTotal())}</Text>
            </View>
          </Card>

          {/* Create Button */}
          <Pressable
            style={[styles.createButton, selectedProducts.length === 0 && styles.createButtonDisabled]}
            onPress={handleCreateTransaction}
            disabled={selectedProducts.length === 0}
          >
            <IconSymbol name="checkmark.circle" size={20} color={Colors.white} />
            <Text style={styles.createButtonText}>Create Transaction</Text>
          </Pressable>
        </View>
      </View>

      {/* Product Selection Modal */}
      <Modal visible={showProductModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <Pressable onPress={() => setShowProductModal(false)}>
                <IconSymbol name="xmark" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchText}
              onChangeText={setSearchText}
            />

            <FlatList
              data={productList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderProductItem}
              style={styles.productListModal}
            />
          </View>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
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
    padding: Spacing.base,
    paddingBottom: 100,
  },
  card: {
    marginBottom: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
  },
  transactionNumber: {
    fontSize: FontSizes.h3,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.base,
    gap: Spacing.xs,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FontSizes.medium,
    fontWeight: FontWeights.semiBold,
  },
  emptyProducts: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyProductsText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptyProductsSubtext: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  selectedProductCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.base,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  selectedProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  selectedProductIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  selectedProductIconText: {
    fontSize: FontSizes.large,
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
  },
  selectedProductPrice: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },
  quantityInput: {
    width: 60,
    height: 36,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.white,
    textAlign: 'center',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subtotalContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  subtotalLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  subtotalValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  totalCard: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
  totalAmount: {
    fontSize: FontSizes.h3,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  createButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  createButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  modalOverlay: {
    ...CommonStyles.modalOverlay,
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  modalTitle: {
    fontSize: FontSizes.xlarge,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    marginBottom: Spacing.base,
  },
  productListModal: {
    maxHeight: 400,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundTertiary,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  productIconText: {
    fontSize: FontSizes.large,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
  },
  productSku: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  productPrice: {
    fontSize: FontSizes.medium,
    fontWeight: FontWeights.medium,
    color: Colors.primary,
    marginTop: Spacing.xxs,
  },
});
