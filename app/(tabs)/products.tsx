import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import SearchBar from '@/components/ui/searchbar';
import { ProductInterface } from '@/db/models/product';
import { ProductService } from '@/db/services/product';
import { BorderRadius, Colors, CommonStyles, FontSizes, FontWeights, Shadows, Spacing } from '@/styles';

export default function ProductScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [productList, setProductList] = useState<ProductInterface[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page] = useState(0);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<ProductInterface>>({
    name: '',
    sku: '',
    price: 0,
    stock: 0,
    icon: '🍔',
    isHaveRecipes: false,
  });

  const getAllProducts = useCallback(async () => {
    try {
      const products = await ProductService.getAllProducts({
        searchQuery: searchText,
        perPage: 20,
        page: page,
      });
      setProductList(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    }
  }, [searchText, page]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await getAllProducts();
    setRefreshing(false);
  }, [getAllProducts]);

  useEffect(() => {
    getAllProducts();
  }, [getAllProducts]);

  // Refresh data whenever user navigates to this screen
  useFocusEffect(
    useCallback(() => {
      console.log('Product screen focused - refreshing data');
      getAllProducts();
    }, [getAllProducts])
  );

  const handleAddProduct = () => {
    setFormData({
      name: '',
      sku: '',
      price: 0,
      stock: 0,
      icon: '🍔',
      isHaveRecipes: false,
    });
    setEditMode(false);
    setShowAddModal(true);
  };

  const handleEditProduct = (product: ProductInterface) => {
    setFormData(product);
    setEditMode(true);
    setShowAddModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (!formData.name || !formData.sku) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (editMode && formData.id) {
        await ProductService.updateProduct(formData.id, {
          name: formData.name,
          sku: formData.sku,
          price: formData.price || 0,
          stock: formData.stock || 0,
          icon: formData.icon || '🍔',
        });
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        await ProductService.createProduct({
          name: formData.name,
          sku: formData.sku,
          price: formData.price || 0,
          stock: formData.stock || 0,
          icon: formData.icon || '🍔',
        });
        Alert.alert('Success', 'Product added successfully!');
      }
      
      setShowAddModal(false);
      await getAllProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    }
  };

  const handleDeleteProduct = async (product: ProductInterface) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${product.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProductService.deleteProduct(product.id);
              Alert.alert('Success', 'Product deleted successfully!');
              await getAllProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewDetail = (product: ProductInterface) => {
    router.push(`/product/${product.id}`);
  };

  const addSampleData = async () => {
    try {
      const sampleProducts = [
        { name: 'Burger Classic', icon: '🍔', sku: 'BURG-001', price: 50000, stock: 0, isHaveRecipes: false },
        { name: 'Cheese Pizza', icon: '🍕', sku: 'PIZZA-001', price: 75000, stock: 0, isHaveRecipes: false },
        { name: 'Fried Chicken', icon: '🍗', sku: 'CHICK-001', price: 35000, stock: 0, isHaveRecipes: false },
        { name: 'French Fries', icon: '🍟', sku: 'FRIES-001', price: 20000, stock: 0, isHaveRecipes: false },
        { name: 'Ice Cream', icon: '🍦', sku: 'ICE-001', price: 15000, stock: 0, isHaveRecipes: false },
      ];

      for (const product of sampleProducts) {
        await ProductService.createProduct(product);
      }

      Alert.alert('Success', `Added ${sampleProducts.length} sample products!`);
      await getAllProducts();
    } catch (error) {
      console.error('Error adding sample data:', error);
      Alert.alert('Error', 'Failed to add sample data');
    }
  };

  const renderProductItem = ({ item }: { item: ProductInterface }) => (
    <Pressable style={styles.productCard} onPress={() => handleViewDetail(item)}>
      {/* Product Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>{item.icon || '🍔'}</Text>
      </View>

      {/* Product Details */}
      <View style={styles.productDetails}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
        </View>
        <View style={{ flexDirection: 'column', gap: 1, marginTop: Spacing.xs }}>
          <Text style={styles.productPrice}>Rp {item.price.toLocaleString()}</Text>
          <Text style={styles.productSku}>SKU: {item.sku}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.productActions}>
        <Pressable style={styles.editButton} onPress={() => handleEditProduct(item)}>
          <IconSymbol name="pencil" size={16} color={Colors.primary} />
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={() => handleDeleteProduct(item)}>
          <IconSymbol name="trash" size={16} color={Colors.error} />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <ParallaxScrollView>
      <ThemedView style={styles.container}>
        <Header title="Products" subtitle="Browse and manage your products" />

        <View style={{
          alignItems: 'flex-end',
          paddingHorizontal: 1,
          marginBottom: Spacing.sm,
        }}>
          <Pressable style={{
            backgroundColor: Colors.primary,
            paddingVertical: 5,
            paddingHorizontal: Spacing.base,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            marginTop: Spacing.sm,
            width: 60,
            alignContent: 'center',
          }} onPress={handleAddProduct}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        <SearchBar
          placeholder="Search products..."
          onChangeText={setSearchText}
          value={searchText}
        />

        {productList.length === 0 && !searchText && (
          <View style={{ paddingHorizontal: Spacing.base, marginTop: Spacing.base, marginBottom: Spacing.sm }}>
            <Pressable style={styles.sampleDataButton} onPress={addSampleData}>
              <IconSymbol name="sparkles" size={20} color={Colors.white} />
              <Text style={styles.sampleDataButtonText}>Add Sample Data (Testing)</Text>
            </Pressable>
          </View>
        )}

        {productList.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="tray" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyStateText}>No products found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText ? 'Try a different search term' : 'Add your first product'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={productList}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductItem}
            style={styles.productList}
            scrollEnabled={false}
            contentContainerStyle={styles.productListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
          />
        )}
      </ThemedView>

      {/* Add/Edit Product Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit Product' : 'Add New Product'}
              </Text>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                }}
              >
                <IconSymbol name="xmark" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Icon</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.icon}
                  onChangeText={(text) => setFormData({ ...formData, icon: text })}
                  placeholder="🍔"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter product name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SKU *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.sku}
                  onChangeText={(text) => setFormData({ ...formData, sku: text })}
                  placeholder="Enter SKU"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.price?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, price: parseInt(text) || 0 })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stock</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.stock?.toString()}
                  onChangeText={(text) => setFormData({ ...formData, stock: parseInt(text) || 0 })}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSaveProduct}>
                <Text style={styles.saveButtonText}>{editMode ? 'Update' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Spacing.base,
  },
  searchBoxContainer: {
    marginTop: Spacing.sm,
  },
  productList: {
    flex: 1,
    marginTop: Spacing.sm,
  },
  productListContent: {
    paddingBottom: 80,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 25,
    fontWeight: FontWeights.semiBold,
  },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.backgroundTertiary,
  },
  iconContainer: {
    width: 55,
    height: 55,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  iconText: {
    fontSize: FontSizes.h2,
  },
  productDetails: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  productName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
    flex: 1,
  },
  productPrice: {
    fontSize: FontSizes.medium,
    fontWeight: FontWeights.semiBold,
    color: Colors.primary,
  },
  productSku: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  productActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.primaryLight,
  },
  deleteButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.errorLight,
  },
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 15,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xxl,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  detailHeader: {
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
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.base,
    ...Shadows.xs,
  },
  backButtonText: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    marginLeft: Spacing.xs,
  },
  detailTitle: {
    fontSize: FontSizes.large,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 80,
  },
  detailContent: {
    flex: 1,
    paddingTop: Spacing.base,
    paddingBottom: 100,
  },
  detailCard: {
    marginBottom: Spacing.base,
  },
  detailProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  detailIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  detailIconText: {
    fontSize: FontSizes.iconLarge,
  },
  detailProductInfo: {
    flex: 1,
  },
  detailProductName: {
    fontSize: FontSizes.h2,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  detailProductSku: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  detailProductPrice: {
    fontSize: FontSizes.xlarge,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundTertiary,
  },
  infoLabel: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  infoValue: {
    fontSize: FontSizes.medium,
    color: Colors.textPrimary,
    fontWeight: FontWeights.semiBold,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.primary,
    marginLeft: Spacing.md,
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
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSizes.xlarge,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  formContainer: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: Spacing.base,
  },
  inputLabel: {
    fontSize: FontSizes.medium,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.white,
  },
  sampleDataButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  sampleDataButtonText: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateText: {
    fontSize: FontSizes.large,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  recipeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.sm,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  recipeAmount: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  addRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.base,
    gap: Spacing.xs,
  },
  addRecipeButtonText: {
    color: Colors.white,
    fontSize: FontSizes.medium,
    fontWeight: FontWeights.semiBold,
  },
  emptyRecipeText: {
    fontSize: FontSizes.medium,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  stockSelector: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
  },
  stockSelectorText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  stockSelectorPlaceholder: {
    fontSize: FontSizes.base,
    color: Colors.textTertiary,
  },
  stockListModal: {
    maxHeight: 400,
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundTertiary,
  },
  stockItemName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stockItemDetails: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  pickerContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundTertiary,
  },
  pickerItemSelected: {
    backgroundColor: Colors.primaryLight,
  },
  pickerItemText: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  pickerItemTextSelected: {
    color: Colors.primary,
    fontWeight: FontWeights.semiBold,
  },
  productionInfo: {
    marginBottom: Spacing.base,
  },
  productionProductName: {
    fontSize: FontSizes.large,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  productionCurrentStock: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  recipePreview: {
    marginTop: Spacing.base,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  recipePreviewTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  recipePreviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  recipePreviewText: {
    fontSize: FontSizes.medium,
    color: Colors.textPrimary,
  },
  recipePreviewStock: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  recipePreviewTextError: {
    color: Colors.error,
    fontWeight: FontWeights.medium,
  },
});
