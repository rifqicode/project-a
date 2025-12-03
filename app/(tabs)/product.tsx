import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/ui/header';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFocusEffect } from '@react-navigation/native';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  isLowStock: boolean;
  icon: string;
  iconColor: string;
  backgroundColor: string;
}

type ViewMode = 'list' | 'detail';

const productData: Product[] = [
  {
    id: '1',
    name: 'Wireless Mouse',
    sku: 'WM-001',
    price: 29.99,
    stock: 45,
    isLowStock: false,
    icon: 'computer.mouse.fill',
    iconColor: '#3b82f6',
    backgroundColor: '#dbeafe'
  },
  {
    id: '2',
    name: 'USB Cable',
    sku: 'UC-002',
    price: 12.99,
    stock: 8,
    isLowStock: true,
    icon: 'cable.connector',
    iconColor: '#ef4444',
    backgroundColor: '#fee2e2'
  },
  {
    id: '3',
    name: 'Keyboard',
    sku: 'KB-003',
    price: 59.99,
    stock: 23,
    isLowStock: false,
    icon: 'keyboard.fill',
    iconColor: '#8b5cf6',
    backgroundColor: '#ede9fe'
  },
  {
    id: '4',
    name: 'Monitor Stand',
    sku: 'MS-004',
    price: 39.99,
    stock: 5,
    isLowStock: true,
    icon: 'display',
    iconColor: '#f59e0b',
    backgroundColor: '#fef3c7'
  },
  {
    id: '5',
    name: 'Laptop Sleeve',
    sku: 'LS-005',
    price: 24.99,
    stock: 67,
    isLowStock: false,
    icon: 'laptopcomputer',
    iconColor: '#06b6d4',
    backgroundColor: '#cffafe'
  },
  {
    id: '6',
    name: 'Laptop Sleeve',
    sku: 'LS-005',
    price: 24.99,
    stock: 67,
    isLowStock: false,
    icon: 'laptopcomputer',
    iconColor: '#06b6d4',
    backgroundColor: '#cffafe'
  }
];

export default function TabTwoScreen() {
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Reset to list view when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      setViewMode('list');
      setSelectedProduct(null);
      setSearchText('');
    }, [])
  );

  const filteredProducts = productData.filter(product =>
    product.name.toLowerCase().includes(searchText.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedProduct(null);
  };

  const renderProductDetail = () => {
    if (!selectedProduct) return null;

    return (
      <ThemedView style={styles.container}>
        {/* Header with back button */}
        <View style={styles.detailHeader}>
          <Pressable 
            onPress={handleBackToList} 
            style={styles.backButton}
            android_ripple={{ color: '#ffffff30' }}
          >
            <IconSymbol name="chevron.left" size={20} color="#ffffff" />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.detailTitle}>Product Detail</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
          {/* Product Info Card */}
          <Card style={styles.detailCard}>
            <View style={styles.detailProductHeader}>
              <View style={[styles.detailIconContainer, { backgroundColor: selectedProduct.backgroundColor }]}>
                <IconSymbol 
                  name={selectedProduct.icon} 
                  size={40} 
                  color={selectedProduct.iconColor} 
                />
              </View>
              <View style={styles.detailProductInfo}>
                <Text style={styles.detailProductName}>{selectedProduct.name}</Text>
                <Text style={styles.detailProductSku}>SKU: {selectedProduct.sku}</Text>
                <Text style={styles.detailProductPrice}>${selectedProduct.price}</Text>
              </View>
            </View>
          </Card>

          {/* Stock Information */}
          <Card style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Stock Information</Text>
            <View style={styles.stockInfo}>
              <View style={styles.stockItem}>
                <Text style={styles.stockLabel}>Current Stock</Text>
                <Text style={[styles.stockValue, selectedProduct.isLowStock && styles.lowStockValue]}>
                  {selectedProduct.stock} units
                </Text>
              </View>
              <View style={styles.stockStatus}>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: selectedProduct.isLowStock ? '#ef4444' : '#10b981' }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: selectedProduct.isLowStock ? '#ef4444' : '#10b981' }
                ]}>
                  {selectedProduct.isLowStock ? 'Low Stock' : 'In Stock'}
                </Text>
              </View>
            </View>
          </Card>

          {/* Quick Actions */}
          <Card style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <Pressable style={styles.actionButton}>
                <IconSymbol name="pencil" size={20} color="#3b82f6" />
                <Text style={styles.actionButtonText}>Edit Product</Text>
              </Pressable>
              <Pressable style={styles.actionButton}>
                <IconSymbol name="plus.circle" size={20} color="#10b981" />
                <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Add Stock</Text>
              </Pressable>
              <Pressable style={styles.actionButton}>
                <IconSymbol name="minus.circle" size={20} color="#f59e0b" />
                <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>Remove Stock</Text>
              </Pressable>
            </View>
          </Card>

          {/* Product Stats */}
          <Card style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Product Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>$1,234</Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>45</Text>
                <Text style={styles.statLabel}>Times Sold</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Times Restocked</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>Oct 20</Text>
                <Text style={styles.statLabel}>Last Updated</Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      </ThemedView>
    );
  };

  const renderProductList = () => (
    <ThemedView style={styles.container}>
      <View>
        <Header title="Products" subtitle="Browse and manage your products" />
      </View>

      <View style={styles.searchBoxContainer}>
        <TextInput placeholder="Search products..." style={styles.searchBox} onChangeText={setSearchText} />
      </View>

      <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
        {filteredProducts.map((product) => (
          <Pressable 
            key={product.id} 
            style={styles.productCard}
            onPress={() => handleProductPress(product)}
          >
            {/* Product Icon */}
            <View style={[styles.iconContainer, { backgroundColor: product.backgroundColor }]}>
              <IconSymbol name={product.icon} size={24} color={product.iconColor} />
            </View>

            {/* Product Details */}
            <View style={styles.productDetails}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.stockNumber}>${product.price}</Text>
              </View>
              <Text style={styles.productSku}>SKU: {product.sku}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.addButton}>
        <IconSymbol name="plus" size={25} color="#ffffff" />
      </Pressable>
    </ThemedView>
  );

  return (
    <ParallaxScrollView>
      {viewMode === 'list' ? renderProductList() : renderProductDetail()}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  addButton: {
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
  container: {
    flex: 1,
    marginTop: 16,
  },
  searchBox: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchBoxContainer: {
    marginTop: 20,
  },
  productContainer: {
    marginBottom: 12,
  },
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
  productList: {
    flex: 1,
    height: 570,
    marginTop: 10,
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
    position: 'relative',
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
  stockNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  productSku: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  lowStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lowStockText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Detail View Styles
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonText: {
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
  headerSpacer: {
    width: 80, // Increased to match back button width
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
  detailProductSku: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  detailProductPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  stockInfo: {
    flexDirection: 'column',
    gap: 16,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  stockLabel: {
    fontSize: 16,
    color: '#374151',
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  lowStockValue: {
    color: '#ef4444',
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'column',
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
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3b82f6',
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
