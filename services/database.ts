import { getDatabase } from '@/db/database';
import { ProductInterface } from '@/models/product';
import { ProductRecipeInterface } from '@/models/product_recipes';
import { StockInterface } from '@/models/stock';

// Product Database Service
export class ProductService {
  static async getAllProducts(): Promise<ProductInterface[]> {
    const db = await getDatabase();
    try {
      const result = await db.getAllAsync(`
        SELECT * FROM products ORDER BY nama ASC
      `);
      return result as ProductInterface[];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  static async getProductById(id: number): Promise<ProductInterface | null> {
    const db = await getDatabase();
    try {
      const result = await db.getFirstAsync(`
        SELECT * FROM products WHERE id = ?
      `, [id]);
      return result as ProductInterface | null;
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  }

  static async createProduct(product: Omit<ProductInterface, 'id'>): Promise<number> {
    const db = await getDatabase();
    try {
      const result = await db.runAsync(`
        INSERT INTO products (nama, code, price, isHaveRecipes)
        VALUES (?, ?, ?, ?)
      `, [product.nama, product.code, product.price, product.isHaveRecipes ? 1 : 0]);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  static async updateProduct(id: number, product: Omit<ProductInterface, 'id'>): Promise<void> {
    const db = await getDatabase();
    try {
      await db.runAsync(`
        UPDATE products 
        SET nama = ?, code = ?, price = ?, isHaveRecipes = ?
        WHERE id = ?
      `, [product.nama, product.code, product.price, product.isHaveRecipes ? 1 : 0, id]);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  static async deleteProduct(id: number): Promise<void> {
    const db = await getDatabase();
    try {
      // Delete product recipes first
      await db.runAsync(`DELETE FROM product_recipes WHERE ProductId = ?`, [id]);
      // Then delete the product
      await db.runAsync(`DELETE FROM products WHERE id = ?`, [id]);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  static async searchProducts(searchTerm: string): Promise<ProductInterface[]> {
    const db = await getDatabase();
    try {
      const result = await db.getAllAsync(`
        SELECT * FROM products 
        WHERE nama LIKE ? OR code LIKE ?
        ORDER BY nama ASC
      `, [`%${searchTerm}%`, `%${searchTerm}%`]);
      return result as ProductInterface[];
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
}

// Product Recipe Database Service
export class ProductRecipeService {
  static async getRecipesByProductId(productId: number): Promise<(ProductRecipeInterface & { stockName: string; stockSku: string })[]> {
    const db = await getDatabase();
    try {
      const result = await db.getAllAsync(`
        SELECT pr.*, s.symbol as stockName, s.sku as stockSku
        FROM product_recipes pr
        JOIN stocks s ON pr.StockId = s.id
        WHERE pr.ProductId = ?
        ORDER BY s.symbol ASC
      `, [productId]);
      return result as (ProductRecipeInterface & { stockName: string; stockSku: string })[];
    } catch (error) {
      console.error('Error fetching product recipes:', error);
      throw error;
    }
  }

  static async createRecipe(recipe: Omit<ProductRecipeInterface, 'id'>): Promise<number> {
    const db = await getDatabase();
    try {
      const result = await db.runAsync(`
        INSERT INTO product_recipes (ProductId, StockId, amount)
        VALUES (?, ?, ?)
      `, [recipe.ProductId, recipe.StockId, recipe.amount]);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }

  static async updateRecipe(id: number, recipe: Omit<ProductRecipeInterface, 'id'>): Promise<void> {
    const db = await getDatabase();
    try {
      await db.runAsync(`
        UPDATE product_recipes 
        SET ProductId = ?, StockId = ?, amount = ?
        WHERE id = ?
      `, [recipe.ProductId, recipe.StockId, recipe.amount, id]);
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  static async deleteRecipe(id: number): Promise<void> {
    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM product_recipes WHERE id = ?`, [id]);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      throw error;
    }
  }

  static async deleteRecipesByProductId(productId: number): Promise<void> {
    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM product_recipes WHERE ProductId = ?`, [productId]);
    } catch (error) {
      console.error('Error deleting product recipes:', error);
      throw error;
    }
  }
}

// Stock Database Service
export class StockService {
  static async getAllStocks(): Promise<StockInterface[]> {
    const db = await getDatabase();
    try {
      const result = await db.getAllAsync(`
        SELECT * FROM stocks ORDER BY symbol ASC
      `);
      return result as StockInterface[];
    } catch (error) {
      console.error('Error fetching stocks:', error);
      throw error;
    }
  }

  static async getStockById(id: number): Promise<StockInterface | null> {
    const db = await getDatabase();
    try {
      const result = await db.getFirstAsync(`
        SELECT * FROM stocks WHERE id = ?
      `, [id]);
      return result as StockInterface | null;
    } catch (error) {
      console.error('Error fetching stock by ID:', error);
      throw error;
    }
  }

  static async createStock(stock: Omit<StockInterface, 'id'>): Promise<number> {
    const db = await getDatabase();
    try {
      const result = await db.runAsync(`
        INSERT INTO stocks (sku, symbol, quantity, purchase_price)
        VALUES (?, ?, ?, ?)
      `, [stock.sku, stock.symbol, stock.quantity, stock.purchase_price]);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error creating stock:', error);
      throw error;
    }
  }

  // Initialize with sample data if needed
  static async initializeSampleData(): Promise<void> {
    const db = await getDatabase();
    try {
      // Check if stocks already exist
      const existingStocks = await db.getFirstAsync(`SELECT COUNT(*) as count FROM stocks`);
      if ((existingStocks as any)?.count > 0) {
        return; // Data already exists
      }

      // Insert sample stock data
      const sampleStocks = [
        { sku: 'MAT-001', symbol: 'Plastic Shell', quantity: 100, purchase_price: 2.50 },
        { sku: 'MAT-002', symbol: 'Electronic Circuit', quantity: 50, purchase_price: 15.00 },
        { sku: 'MAT-003', symbol: 'Key Switches', quantity: 1000, purchase_price: 0.50 },
        { sku: 'MAT-004', symbol: 'USB Connector', quantity: 75, purchase_price: 3.00 },
        { sku: 'MAT-005', symbol: 'LED Backlight', quantity: 200, purchase_price: 1.25 },
        { sku: 'MAT-006', symbol: 'Keycaps', quantity: 500, purchase_price: 0.75 },
      ];

      for (const stock of sampleStocks) {
        await this.createStock(stock);
      }

      console.log('Sample stock data initialized');
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw error;
    }
  }
}