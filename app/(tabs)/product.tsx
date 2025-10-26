import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFocusEffect } from '@react-navigation/native';

// Database services
import { ProductInterface } from '@/models/product';
import { ProductRecipeInterface } from '@/models/product_recipes';
import { StockInterface } from '@/models/stock';
import { ProductRecipeService, ProductService, StockService } from '@/services/database';

// Enhanced Product interface for UI
interface Product extends ProductInterface {
  stock?: number;
  icon?: string;
  iconColor?: string;
  backgroundColor?: string;
}

// Recipe interface for UI
interface Recipe extends ProductRecipeInterface {
  stockName: string;
  stockSku: string;
}

type ViewMode = 'list' | 'detail' | 'form';

export default function ProductScreen() {
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productRecipes, setProductRecipes] = useState<Recipe[]>([]);
  const [stocks, setStocks] = useState<StockInterface[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    code: '',
    price: '',
    isHaveRecipes: false
  });

  // Recipe modal states
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    stockId: '',
    amount: ''
  });

  // Helper function to add UI properties to products
  const enhanceProduct = (product: ProductInterface): Product => {
    const iconMap: { [key: string]: { icon: string; iconColor: string; backgroundColor: string } } = {
      'WM': { icon: 'computer.mouse.fill', iconColor: '#3b82f6', backgroundColor: '#dbeafe' },
      'GK': { icon: 'keyboard.fill', iconColor: '#8b5cf6', backgroundColor: '#ede9fe' },
      'UC': { icon: 'cable.connector', iconColor: '#ef4444', backgroundColor: '#fee2e2' },
      'MS': { icon: 'display', iconColor: '#f59e0b', backgroundColor: '#fef3c7' },
    };

    const codePrefix = product.code.split('-')[0];
    const uiProps = iconMap[codePrefix] || { icon: 'bag.fill', iconColor: '#3b82f6', backgroundColor: '#dbeafe' };

    return {
      ...product,
      stock: 0, // This would come from inventory system
      ...uiProps
    };
  };

  // Load data functions
  const loadProducts = React.useCallback(async (searchTerm?: string) => {
    setLoading(true);
    try {
      let productData: ProductInterface[];
      if (searchTerm) {
        productData = await ProductService.searchProducts(searchTerm);
      } else {
        productData = await ProductService.getAllProducts();
      }
      const enhancedProducts = productData.map(enhanceProduct);
      setProducts(enhancedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStocks = React.useCallback(async () => {
    try {
      await StockService.initializeSampleData(); // Initialize sample data if needed
      const stockData = await StockService.getAllStocks();
      setStocks(stockData);
    } catch (error) {
      console.error('Error loading stocks:', error);
      Alert.alert('Error', 'Failed to load stock data');
    }
  }, []);

  const loadProductRecipes = React.useCallback(async (productId: number) => {
    try {
      const recipes = await ProductRecipeService.getRecipesByProductId(productId);
      setProductRecipes(recipes);
    } catch (error) {
      console.error('Error loading product recipes:', error);
      Alert.alert('Error', 'Failed to load product recipes');
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    loadProducts();
    loadStocks();
  }, [loadProducts, loadStocks]);

  // Reset to list view when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      setViewMode('list');
      setSelectedProduct(null);
      setSearchText('');
      loadProducts(); // Refresh products when tab is focused
    }, [loadProducts])
  );

  // Search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim()) {
        loadProducts(searchText.trim());
      } else {
        loadProducts();
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchText, loadProducts]);

  // Navigation functions
  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setViewMode('detail');
    if (product.isHaveRecipes) {
      loadProductRecipes(product.id);
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProduct(null);
    setEditingProduct(null);
    setFormData({ nama: '', code: '', price: '', isHaveRecipes: false });
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({ nama: '', code: '', price: '', isHaveRecipes: false });
    setViewMode('form');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nama: product.nama,
      code: product.code,
      price: product.price.toString(),
      isHaveRecipes: product.isHaveRecipes
    });
    setViewMode('form');
    if (product.isHaveRecipes) {
      loadProductRecipes(product.id);
    }
  };

  // Product CRUD operations
  const handleSaveProduct = async () => {
    if (!formData.nama || !formData.code || !formData.price) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (isNaN(parseFloat(formData.price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        nama: formData.nama,
        code: formData.code,
        price: parseFloat(formData.price),
        isHaveRecipes: formData.isHaveRecipes
      };

      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await ProductService.createProduct(productData);
        Alert.alert('Success', 'Product added successfully');
      }

      setViewMode('list');
      setFormData({ nama: '', code: '', price: '', isHaveRecipes: false });
      setEditingProduct(null);
      loadProducts(); // Reload products to reflect changes
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await ProductService.deleteProduct(productId);
              
              if (selectedProduct?.id === productId) {
                setViewMode('list');
                setSelectedProduct(null);
              }
              
              loadProducts(); // Reload products to reflect changes
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Recipe management
  const addRecipe = async () => {
    if (!newRecipe.stockId || !newRecipe.amount || !selectedProduct) {
      Alert.alert('Error', 'Please fill all recipe fields');
      return;
    }

    if (isNaN(parseFloat(newRecipe.amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const stockIdNum = parseInt(newRecipe.stockId);
    const stock = stocks.find(s => s.id === stockIdNum);
    if (!stock) return;

    setLoading(true);
    try {
      await ProductRecipeService.createRecipe({
        ProductId: selectedProduct.id,
        StockId: stockIdNum,
        amount: parseFloat(newRecipe.amount)
      });

      // Reload recipes for the current product
      loadProductRecipes(selectedProduct.id);
      setNewRecipe({ stockId: '', amount: '' });
      setShowRecipeModal(false);
      Alert.alert('Success', 'Recipe added successfully');
    } catch (error) {
      console.error('Error adding recipe:', error);
      Alert.alert('Error', 'Failed to add recipe');
    } finally {
      setLoading(false);
    }
  };

  const removeRecipe = async (productId: number, recipeId: number) => {
    Alert.alert(
      'Remove Recipe',
      'Are you sure you want to remove this recipe?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await ProductRecipeService.deleteRecipe(recipeId);
              // Reload recipes for the current product
              loadProductRecipes(productId);
              Alert.alert('Success', 'Recipe removed successfully');
            } catch (error) {
              console.error('Error removing recipe:', error);
              Alert.alert('Error', 'Failed to remove recipe');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Derived state
  const filteredProducts = products.filter(product =>
    product.nama.toLowerCase().includes(searchText.toLowerCase()) ||
    product.code.toLowerCase().includes(searchText.toLowerCase())
  );

  // Render functions
  const renderProductList = () => (
    <ThemedView style={styles.container}>
      <Header title="Products" subtitle="Manage your product catalog" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color="#6b7280" />
        <TextInput 
          placeholder="Search products by name or code..." 
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <Pressable onPress={() => setSearchText('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color="#6b7280" />
          </Pressable>
        )}
      </View>

      {/* Product List */}
      <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="bag" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>
              {searchText ? 'No products found' : 'No products available'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText ? 'Try adjusting your search' : 'Add your first product to get started'}
            </Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <Pressable 
              key={product.id} 
              style={styles.productCard}
              onPress={() => handleProductPress(product)}
            >
              <View style={[styles.iconContainer, { backgroundColor: product.backgroundColor }]}>
                <IconSymbol 
                  name={product.icon || 'bag.fill'} 
                  size={24} 
                  color={product.iconColor || '#3b82f6'} 
                />
              </View>

              <View style={styles.productDetails}>
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{product.nama}</Text>
                  <Text style={styles.productPrice}>${product.price}</Text>
                </View>
                <Text style={styles.productCode}>Code: {product.code}</Text>
                <View style={styles.productFooter}>
                  <Text style={styles.stockText}>Stock: {product.stock || 0} units</Text>
                  {product.isHaveRecipes && (
                    <View style={styles.recipesBadge}>
                      <IconSymbol name="list.bullet" size={12} color="#8b5cf6" />
                      <Text style={styles.recipesBadgeText}>Has Recipes</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Add Product Button */}
      <Pressable style={styles.addButton} onPress={handleAddProduct}>
        <IconSymbol name="plus" size={25} color="#ffffff" />
      </Pressable>
    </ThemedView>
  );

  const renderProductDetail = () => {
    if (!selectedProduct) return null;

    return (
      <ThemedView style={styles.container}>
        {/* Header with back button */}
        <View style={styles.detailHeader}>
          <Pressable 
            onPress={handleBackToList} 
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left" size={20} color="#ffffff" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.detailTitle}>Product Detail</Text>
          <Pressable 
            onPress={() => handleEditProduct(selectedProduct)} 
            style={styles.editHeaderButton}
          >
            <IconSymbol name="pencil" size={20} color="#3b82f6" />
          </Pressable>
        </View>

        <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
          {/* Product Info Card */}
          <Card style={styles.detailCard}>
            <View style={styles.detailProductHeader}>
              <View style={[styles.detailIconContainer, { backgroundColor: selectedProduct.backgroundColor }]}>
                <IconSymbol 
                  name={selectedProduct.icon || 'bag.fill'} 
                  size={40} 
                  color={selectedProduct.iconColor || '#3b82f6'} 
                />
              </View>
              <View style={styles.detailProductInfo}>
                <Text style={styles.detailProductName}>{selectedProduct.nama}</Text>
                <Text style={styles.detailProductCode}>Code: {selectedProduct.code}</Text>
                <Text style={styles.detailProductPrice}>${selectedProduct.price}</Text>
                <Text style={styles.detailStockInfo}>Stock: {selectedProduct.stock || 0} units</Text>
              </View>
            </View>
          </Card>

          {/* Recipes Section */}
          {selectedProduct.isHaveRecipes && (
            <Card style={styles.detailCard}>
              <View style={styles.recipesHeader}>
                <Text style={styles.sectionTitle}>Product Recipes</Text>
                <Pressable 
                  onPress={() => setShowRecipeModal(true)}
                  style={styles.addRecipeButton}
                >
                  <IconSymbol name="plus" size={16} color="#3b82f6" />
                  <Text style={styles.addRecipeButtonText}>Add</Text>
                </Pressable>
              </View>

              {productRecipes.length > 0 ? (
                productRecipes.map((recipe) => (
                  <View key={recipe.id} style={styles.recipeItem}>
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName}>{recipe.stockName}</Text>
                      <Text style={styles.recipeAmount}>{recipe.amount} pcs</Text>
                    </View>
                    <Pressable 
                      onPress={() => removeRecipe(selectedProduct.id, recipe.id)}
                      style={styles.removeRecipeButton}
                    >
                      <IconSymbol name="trash" size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                ))
              ) : (
                <View style={styles.noRecipesContainer}>
                  <Text style={styles.noRecipesText}>No recipes added yet</Text>
                  <Text style={styles.noRecipesSubtext}>Add ingredients needed to make this product</Text>
                </View>
              )}
            </Card>
          )}

          {/* Quick Actions */}
          <Card style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <Pressable 
                style={styles.actionButton}
                onPress={() => handleEditProduct(selectedProduct)}
              >
                <IconSymbol name="pencil" size={20} color="#3b82f6" />
                <Text style={styles.actionButtonText}>Edit Product</Text>
              </Pressable>
              <Pressable 
                style={[styles.actionButton, styles.deleteActionButton]}
                onPress={() => handleDeleteProduct(selectedProduct.id)}
              >
                <IconSymbol name="trash" size={20} color="#ef4444" />
                <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Delete Product</Text>
              </Pressable>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  };

  const renderProductForm = () => (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <Pressable onPress={handleBackToList} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={20} color="#ffffff" />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.detailTitle}>
          {editingProduct ? 'Edit Product' : 'Add Product'}
        </Text>
        <Pressable onPress={handleSaveProduct} style={styles.saveButton}>
          <IconSymbol name="checkmark" size={20} color="#ffffff" />
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Product Information</Text>
          
          <Text style={styles.formLabel}>Product Name *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.nama}
            onChangeText={(text) => setFormData({...formData, nama: text})}
            placeholder="Enter product name"
          />

          <Text style={styles.formLabel}>Product Code *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.code}
            onChangeText={(text) => setFormData({...formData, code: text})}
            placeholder="Enter product code (e.g., WM-001)"
          />

          <Text style={styles.formLabel}>Price *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.price}
            onChangeText={(text) => setFormData({...formData, price: text})}
            placeholder="Enter price"
            keyboardType="numeric"
          />

          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>Has Recipes</Text>
              <Text style={styles.switchSubLabel}>
                Enable if this product requires ingredients/materials
              </Text>
            </View>
            <Switch
              value={formData.isHaveRecipes}
              onValueChange={(value) => setFormData({...formData, isHaveRecipes: value})}
              trackColor={{ false: '#767577', true: '#3b82f6' }}
              thumbColor={formData.isHaveRecipes ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </Card>

        {/* Recipe Management in Form */}
        {formData.isHaveRecipes && editingProduct && (
          <Card style={styles.formCard}>
            <View style={styles.recipesHeader}>
              <Text style={styles.formSectionTitle}>Product Recipes</Text>
              <Pressable 
                onPress={() => {
                  setSelectedProduct(editingProduct);
                  setShowRecipeModal(true);
                }}
                style={styles.addRecipeButton}
              >
                <IconSymbol name="plus" size={16} color="#3b82f6" />
                <Text style={styles.addRecipeButtonText}>Add</Text>
              </Pressable>
            </View>
            
            {productRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.recipeItem}>
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName}>{recipe.stockName}</Text>
                  <Text style={styles.recipeAmount}>{recipe.amount} pcs</Text>
                </View>
                <Pressable 
                  onPress={() => removeRecipe(editingProduct.id, recipe.id)}
                  style={styles.removeRecipeButton}
                >
                  <IconSymbol name="trash" size={16} color="#ef4444" />
                </Pressable>
              </View>
            )) || (
              <Text style={styles.noRecipesText}>No recipes added yet</Text>
            )}
          </Card>
        )}
      </ScrollView>
    </ThemedView>
  );

  return (
    <ParallaxScrollView>
      {viewMode === 'list' && renderProductList()}
      {viewMode === 'detail' && renderProductDetail()}
      {viewMode === 'form' && renderProductForm()}

      {/* Recipe Modal */}
      <Modal
        visible={showRecipeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Recipe</Text>
              <Pressable onPress={() => setShowRecipeModal(false)}>
                <IconSymbol name="xmark" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Select Material/Ingredient</Text>
            <View style={styles.pickerContainer}>
              <ScrollView style={styles.stockPicker} showsVerticalScrollIndicator={false}>
                {stocks.map((stock) => (
                  <Pressable
                    key={stock.id}
                    style={[
                      styles.stockOption,
                      newRecipe.stockId === stock.id.toString() && styles.stockOptionSelected
                    ]}
                    onPress={() => setNewRecipe({...newRecipe, stockId: stock.id.toString()})}
                  >
                    <Text style={[
                      styles.stockOptionText,
                      newRecipe.stockId === stock.id.toString() && styles.stockOptionTextSelected
                    ]}>
                      {stock.symbol}
                    </Text>
                    <Text style={[
                      styles.stockOptionSku,
                      newRecipe.stockId === stock.id.toString() && styles.stockOptionSkuSelected
                    ]}>
                      {stock.sku} - ${stock.purchase_price}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.modalLabel}>Amount Required</Text>
            <TextInput
              style={styles.modalInput}
              value={newRecipe.amount}
              onChangeText={(text) => setNewRecipe({...newRecipe, amount: text})}
              placeholder="Enter amount"
              keyboardType="numeric"
            />



            <View style={styles.modalButtons}>
              <Pressable 
                style={styles.modalCancelButton} 
                onPress={() => setShowRecipeModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSaveButton} onPress={addRecipe}>
                <Text style={styles.modalSaveText}>Add Recipe</Text>
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
    marginTop: 16,
  },
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  // Product list styles
  productList: {
    flex: 1,
    marginBottom: 80,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  productDetails: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  productCode: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    color: '#6b7280',
  },
  recipesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  recipesBadgeText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
    marginLeft: 4,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Add button
  addButton: {
    position: 'absolute',
    bottom: 25,
    right: 15,
    backgroundColor: '#3b82f6',
    borderRadius: 25,
    width: 50,
    height: 50,
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
  // Detail view styles
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  editHeaderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  detailContent: {
    flex: 1,
    paddingTop: 16,
  },
  detailCard: {
    marginBottom: 16,
  },
  detailProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailProductInfo: {
    flex: 1,
  },
  detailProductName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  detailProductCode: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailProductPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  detailStockInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  // Recipes styles
  recipesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  addRecipeButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginLeft: 4,
  },
  recipeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  recipeAmount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  removeRecipeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  noRecipesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noRecipesText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  noRecipesSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
  // Action buttons
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  deleteActionButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 12,
  },
  // Form styles
  formContent: {
    flex: 1,
    paddingTop: 16,
  },
  formCard: {
    marginBottom: 16,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  switchSubLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    maxHeight: 200,
  },
  stockPicker: {
    maxHeight: 200,
  },
  stockOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  stockOptionSelected: {
    backgroundColor: '#dbeafe',
  },
  stockOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  stockOptionTextSelected: {
    color: '#3b82f6',
  },
  stockOptionSku: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  stockOptionSkuSelected: {
    color: '#1d4ed8',
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  unitOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  unitOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  unitOptionTextSelected: {
    color: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});
