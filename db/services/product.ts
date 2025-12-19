import { getDatabase } from '../database';
import { ProductInterface } from '../models/product';
import { ProductRecipeInterface } from '../models/product_recipes';

export class ProductService {
  /**
   * Get all products with optional search and pagination
   */
  static async getAllProducts(params: {
    searchQuery?: string;
    page?: number;
    perPage?: number;
  } = {}): Promise<ProductInterface[]> {
    const db = await getDatabase();
    const { searchQuery = '', page = 0, perPage = 20 } = params;
    const offset = page * perPage;

    let query = 'SELECT * FROM products';
    const queryParams: any[] = [];

    if (searchQuery) {
      query += ' WHERE name LIKE ? OR sku LIKE ?';
      queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    query += ' ORDER BY updatedAt DESC LIMIT ? OFFSET ?';
    queryParams.push(perPage, offset);

    const result = await db.getAllAsync<ProductInterface>(query, queryParams);
    return result;
  }

  /**
   * Get a single product by ID
   */
  static async getProductById(id: number): Promise<ProductInterface | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<ProductInterface>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    return result || null;
  }

  /**
   * Create a new product
   */
  static async createProduct(data: {
    icon?: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    isHaveRecipes?: boolean;
  }): Promise<number> {
    const db = await getDatabase();
    
    const result = await db.runAsync(
      `INSERT INTO products (icon, name, sku, price, stock, isHaveRecipes, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        data.icon || '',
        data.name,
        data.sku,
        data.price,
        data.stock,
        data.isHaveRecipes ? 1 : 0,
      ]
    );

    return result.lastInsertRowId;
  }

  /**
   * Update an existing product
   */
  static async updateProduct(
    id: number,
    data: {
      icon?: string;
      name?: string;
      sku?: string;
      price?: number;
      stock?: number;
      isHaveRecipes?: boolean;
    }
  ): Promise<void> {
    const db = await getDatabase();
    
    const updates: string[] = [];
    const values: any[] = [];

    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.sku !== undefined) {
      updates.push('sku = ?');
      values.push(data.sku);
    }
    if (data.price !== undefined) {
      updates.push('price = ?');
      values.push(data.price);
    }
    if (data.stock !== undefined) {
      updates.push('stock = ?');
      values.push(data.stock);
    }
    if (data.isHaveRecipes !== undefined) {
      updates.push('isHaveRecipes = ?');
      values.push(data.isHaveRecipes ? 1 : 0);
    }

    if (updates.length === 0) return;

    updates.push('updatedAt = datetime("now")');
    values.push(id);

    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  }

  /**
   * Delete a product and its recipes
   */
  static async deleteProduct(id: number): Promise<void> {
    const db = await getDatabase();
    
    // Delete product recipes first
    await db.runAsync('DELETE FROM product_recipes WHERE ProductId = ?', [id]);
    
    // Delete the product
    await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
  }

  /**
   * Get product recipes
   */
  static async getProductRecipes(productId: number): Promise<ProductRecipeInterface[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<ProductRecipeInterface>(
      'SELECT * FROM product_recipes WHERE ProductId = ?',
      [productId]
    );
    return result;
  }

  /**
   * Get product recipes with stock details
   */
  static async getProductRecipesWithDetails(productId: number): Promise<any[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync(
      `SELECT 
        pr.id,
        pr.ProductId,
        pr.StockId,
        pr.amount,
        s.name as stockName,
        s.symbol as stockSymbol,
        s.quantity as stockQuantity
      FROM product_recipes pr
      LEFT JOIN stocks s ON pr.StockId = s.id
      WHERE pr.ProductId = ?`,
      [productId]
    );
    return result;
  }

  /**
   * Add a recipe to a product
   */
  static async addProductRecipe(data: {
    ProductId: number;
    StockId: number;
    amount: number;
  }): Promise<number> {
    const db = await getDatabase();
    
    const result = await db.runAsync(
      'INSERT INTO product_recipes (ProductId, StockId, amount) VALUES (?, ?, ?)',
      [data.ProductId, data.StockId, data.amount]
    );

    // Update product to indicate it has recipes
    await db.runAsync(
      'UPDATE products SET isHaveRecipes = 1, updatedAt = datetime("now") WHERE id = ?',
      [data.ProductId]
    );

    return result.lastInsertRowId;
  }

  /**
   * Update a product recipe
   */
  static async updateProductRecipe(
    id: number,
    data: {
      StockId?: number;
      amount?: number;
    }
  ): Promise<void> {
    const db = await getDatabase();
    
    const updates: string[] = [];
    const values: any[] = [];

    if (data.StockId !== undefined) {
      updates.push('StockId = ?');
      values.push(data.StockId);
    }
    if (data.amount !== undefined) {
      updates.push('amount = ?');
      values.push(data.amount);
    }

    if (updates.length === 0) return;

    values.push(id);
    const query = `UPDATE product_recipes SET ${updates.join(', ')} WHERE id = ?`;
    await db.runAsync(query, values);
  }

  /**
   * Delete a product recipe
   */
  static async deleteProductRecipe(id: number): Promise<void> {
    const db = await getDatabase();
    
    // Get the ProductId before deleting
    const recipe = await db.getFirstAsync<ProductRecipeInterface>(
      'SELECT ProductId FROM product_recipes WHERE id = ?',
      [id]
    );

    // Delete the recipe
    await db.runAsync('DELETE FROM product_recipes WHERE id = ?', [id]);

    // Check if product still has recipes
    if (recipe) {
      const remainingRecipes = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM product_recipes WHERE ProductId = ?',
        [recipe.ProductId]
      );

      if (remainingRecipes && remainingRecipes.count === 0) {
        // Update product to indicate it has no recipes
        await db.runAsync(
          'UPDATE products SET isHaveRecipes = 0, updatedAt = datetime("now") WHERE id = ?',
          [recipe.ProductId]
        );
      }
    }
  }

  /**
   * Delete all recipes for a product
   */
  static async deleteAllProductRecipes(productId: number): Promise<void> {
    const db = await getDatabase();
    
    await db.runAsync('DELETE FROM product_recipes WHERE ProductId = ?', [productId]);
    
    // Update product to indicate it has no recipes
    await db.runAsync(
      'UPDATE products SET isHaveRecipes = 0, updatedAt = datetime("now") WHERE id = ?',
      [productId]
    );
  }

  /**
   * Check if a product can be made (has enough stock for all recipes)
   */
  static async canMakeProduct(productId: number, quantity: number = 1): Promise<{
    canMake: boolean;
    missingIngredients: string[];
  }> {
    const recipes = await this.getProductRecipesWithDetails(productId);
    const missingIngredients: string[] = [];

    for (const recipe of recipes) {
      const requiredAmount = recipe.amount * quantity;
      if (recipe.stockQuantity < requiredAmount) {
        missingIngredients.push(
          `${recipe.stockName}: need ${requiredAmount} ${recipe.stockSymbol}, have ${recipe.stockQuantity} ${recipe.stockSymbol}`
        );
      }
    }

    return {
      canMake: missingIngredients.length === 0,
      missingIngredients,
    };
  }
}
