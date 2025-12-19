import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProductInterface } from '@/db/models/product';
import { StockInterface } from '@/db/models/stock';
import { ProductService } from '@/db/services/product';
import { ProductionService } from '@/db/services/production';
import { StockService } from '@/db/services/stock';
import { BorderRadius, Colors, CommonStyles, FontSizes, FontWeights, Spacing } from '@/styles';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id);

  const [selectedProduct, setSelectedProduct] = useState<ProductInterface | null>(null);
  const [productRecipes, setProductRecipes] = useState<any[]>([]);
  const [stockList, setStockList] = useState<StockInterface[]>([]);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showStockSelectorModal, setShowStockSelectorModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<Partial<ProductInterface>>({
    name: '',
    sku: '',
    price: 0,
    stock: 0,
    icon: '🍔',
  });
  
  const [recipeFormData, setRecipeFormData] = useState({
    StockId: 0,
    amount: 0,
  });
  const [selectedStockName, setSelectedStockName] = useState('');
  const [productionQuantity, setProductionQuantity] = useState('1');

  const loadProductData = useCallback(async () => {
    try {
      const product = await ProductService.getProductById(productId);
      if (product) {
        setSelectedProduct(product);
        
        // Load recipes
        const recipes = await ProductService.getProductRecipesWithDetails(productId);
        setProductRecipes(recipes);
      } else {
        Alert.alert('Error', 'Product not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    }
  }, [productId, router]);

  const loadStocks = useCallback(async () => {
    try {
      const stocks = await StockService.getAllStocks({
        searchQuery: '',
        perPage: 100,
        page: 0,
      });
      setStockList(stocks);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  }, []);

  useEffect(() => {
    loadProductData();
    loadStocks();
  }, [loadProductData, loadStocks]);

  const handleBackToList = () => {
    router.back();
  };

  const handleEditProduct = () => {
    if (!selectedProduct) return;
    setFormData(selectedProduct);
    setShowEditModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (!formData.name || !formData.sku) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (formData.id) {
        await ProductService.updateProduct(formData.id, {
          name: formData.name,
          sku: formData.sku,
          price: formData.price || 0,
          stock: formData.stock || 0,
          icon: formData.icon || '🍔',
        });
        Alert.alert('Success', 'Product updated successfully!');
      }
      
      setShowEditModal(false);
      await loadProductData();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${selectedProduct.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProductService.deleteProduct(selectedProduct.id);
              Alert.alert('Success', 'Product deleted successfully!');
              router.back();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAddRecipe = () => {
    setRecipeFormData({ StockId: 0, amount: 0 });
    setSelectedStockName('');
    setShowAddRecipeModal(true);
  };

  const handleSelectStock = (stock: StockInterface) => {
    setRecipeFormData({ ...recipeFormData, StockId: stock.id });
    setSelectedStockName(`${stock.name} (${stock.symbol})`);
    setShowStockSelectorModal(false);
  };

  const handleSaveRecipe = async () => {
    try {
      if (!selectedProduct || !recipeFormData.StockId || !recipeFormData.amount) {
        Alert.alert('Error', 'Please select a stock item and enter amount');
        return;
      }

      await ProductService.addProductRecipe({
        ProductId: selectedProduct.id,
        StockId: recipeFormData.StockId,
        amount: recipeFormData.amount,
      });

      Alert.alert('Success', 'Recipe added successfully!');
      setShowAddRecipeModal(false);
      
      // Reload recipes
      await loadProductData();
    } catch (error) {
      console.error('Error adding recipe:', error);
      Alert.alert('Error', 'Failed to add recipe. Please try again.');
    }
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    Alert.alert(
      'Delete Recipe',
      'Are you sure you want to delete this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProductService.deleteProductRecipe(recipeId);
              Alert.alert('Success', 'Recipe deleted successfully!');
              await loadProductData();
            } catch (error) {
              console.error('Error deleting recipe:', error);
              Alert.alert('Error', 'Failed to delete recipe. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleProduceProduct = () => {
    if (!selectedProduct) return;
    
    if (!selectedProduct.isHaveRecipes) {
      Alert.alert('Error', 'This product does not have recipes. Please add recipes first.');
      return;
    }

    setProductionQuantity('1');
    setShowProductionModal(true);
  };

  const handleConfirmProduction = async () => {
    if (!selectedProduct) return;

    const quantity = parseInt(productionQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      const result = await ProductionService.produceProduct(selectedProduct.id, quantity);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        setShowProductionModal(false);
        await loadProductData();
      } else {
        Alert.alert('Production Failed', result.message);
      }
    } catch (error) {
      console.error('Error producing product:', error);
      Alert.alert('Error', 'Failed to produce product. Please try again.');
    }
  };

  if (!selectedProduct) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ParallaxScrollView>
      <View style={{ flex: 1 }}>
        {/* Header with back button */}
        <View style={styles.detailHeader}>
          <Pressable onPress={handleBackToList} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={20} color={Colors.black} />
          </Pressable>
          <Text style={styles.detailTitle}>Product Detail</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.detailContent}>
          {/* Product Info Card */}
          <Card style={styles.detailCard}>
            <View style={styles.detailProductHeader}>
              <View style={styles.detailIconContainer}>
                <Text style={styles.detailIconText}>{selectedProduct.icon || '🍔'}</Text>
              </View>
              <View style={styles.detailProductInfo}>
                <Text style={styles.detailProductName}>{selectedProduct.name}</Text>
                <Text style={styles.detailProductSku}>SKU: {selectedProduct.sku}</Text>
                <Text style={styles.detailProductPrice}>Rp {selectedProduct.price.toLocaleString()}</Text>
              </View>
            </View>
          </Card>

          {/* Product Info */}
          <Card style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Product Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Stock</Text>
              <Text style={styles.infoValue}>{selectedProduct.stock} units</Text>
            </View>
          </Card>

          {/* Recipes Section */}
          <Card style={styles.detailCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base }}>
              <Text style={styles.sectionTitle}>Recipes ({productRecipes.length})</Text>
              <Pressable style={styles.addRecipeButton} onPress={handleAddRecipe}>
                <IconSymbol name="plus" size={16} color={Colors.white} />
                <Text style={styles.addRecipeButtonText}>Add</Text>
              </Pressable>
            </View>

            {productRecipes.length === 0 ? (
              <Text style={styles.emptyRecipeText}>No recipes added yet</Text>
            ) : (
              productRecipes.map((recipe) => (
                <View key={recipe.id} style={styles.recipeItem}>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName}>{recipe.stockName}</Text>
                    <Text style={styles.recipeAmount}>
                      {recipe.amount} {recipe.stockSymbol}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleDeleteRecipe(recipe.id)}>
                    <IconSymbol name="trash" size={16} color={Colors.error} />
                  </Pressable>
                </View>
              ))
            )}
          </Card>

          {/* Quick Actions */}
          <Card style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <Pressable style={styles.actionButton} onPress={handleEditProduct}>
                <IconSymbol name="pencil" size={20} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Edit Product</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={handleDeleteProduct}>
                <IconSymbol name="trash" size={20} color={Colors.error} />
                <Text style={[styles.actionButtonText, { color: Colors.error }]}>Delete Product</Text>
              </Pressable>
              <Pressable style={styles.actionButton} onPress={handleProduceProduct}>
                <IconSymbol name="production" size={20} color={Colors.success} />
                <Text style={styles.actionButtonText}>Produce</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </View>

      {/* Edit Product Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Product</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
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
              <Pressable style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSaveProduct}>
                <Text style={styles.saveButtonText}>Update</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Recipe Modal */}
      <Modal visible={showAddRecipeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Recipe</Text>
              <Pressable onPress={() => setShowAddRecipeModal(false)}>
                <IconSymbol name="xmark" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Stock Item *</Text>
                <Pressable
                  style={styles.stockSelector}
                  onPress={() => setShowStockSelectorModal(true)}
                >
                  {selectedStockName ? (
                    <Text style={styles.stockSelectorText}>{selectedStockName}</Text>
                  ) : (
                    <Text style={styles.stockSelectorPlaceholder}>Select stock item</Text>
                  )}
                  <IconSymbol name="chevron.down" size={16} color={Colors.textTertiary} />
                </Pressable>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount *</Text>
                <TextInput
                  style={styles.textInput}
                  value={recipeFormData.amount.toString()}
                  onChangeText={(text) =>
                    setRecipeFormData({ ...recipeFormData, amount: parseFloat(text) || 0 })
                  }
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setShowAddRecipeModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleSaveRecipe}>
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Stock Selector Modal */}
      <Modal visible={showStockSelectorModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={{ ...styles.modalContent, width: '80%' }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Stock Item</Text>
              <Pressable onPress={() => setShowStockSelectorModal(false)}>
                <IconSymbol name="xmark" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <FlatList
              data={stockList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable style={styles.stockItem} onPress={() => handleSelectStock(item)}>
                  <View>
                    <Text style={styles.stockItemName}>{item.name}</Text>
                    <Text style={styles.stockItemDetails}>
                      {item.symbol} • Stock: {item.quantity}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={Colors.textTertiary} />
                </Pressable>
              )}
              style={styles.stockListModal}
            />
          </View>
        </View>
      </Modal>

      {/* Production Modal */}
      <Modal visible={showProductionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Produce Product</Text>
              <Pressable onPress={() => setShowProductionModal(false)}>
                <IconSymbol name="xmark" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.productionInfo}>
                <Text style={styles.productionProductName}>{selectedProduct.name}</Text>
                <Text style={styles.productionCurrentStock}>
                  Current Stock: {selectedProduct.stock} units
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quantity to Produce *</Text>
                <TextInput
                  style={styles.textInput}
                  value={productionQuantity}
                  onChangeText={setProductionQuantity}
                  placeholder="1"
                  keyboardType="numeric"
                />
              </View>

              {productRecipes.length > 0 && (
                <View style={styles.recipePreview}>
                  <Text style={styles.recipePreviewTitle}>Required Materials:</Text>
                  {productRecipes.map((recipe) => {
                    const required = recipe.amount * parseInt(productionQuantity || '0');
                    const available = recipe.stockQuantity;
                    const isInsufficient = available < required;
                    
                    return (
                      <View key={recipe.id} style={styles.recipePreviewItem}>
                        <Text style={[
                          styles.recipePreviewText,
                          isInsufficient && styles.recipePreviewTextError
                        ]}>
                          • {recipe.stockName}: {required} {recipe.stockSymbol}
                        </Text>
                        <Text style={[
                          styles.recipePreviewStock,
                          isInsufficient && styles.recipePreviewTextError
                        ]}>
                          (Available: {available})
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setShowProductionModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleConfirmProduction}>
                <Text style={styles.saveButtonText}>Produce</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
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
