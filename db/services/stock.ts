import { getDatabase } from "../database";
import { StockInterface } from "../models/stock";
import { StockHistoryInterface } from "../models/stock_history";

export class StockService {
  /**
   * Create stock history record
   */
  private static async createStockHistory(
    stockId: number,
    transactionType: 'IN' | 'OUT',
    quantity: number
  ): Promise<void> {
    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO stock_history (StockId, transactionType, quantity) 
         VALUES (?, ?, ?)`,
        [stockId, transactionType, quantity]
      );
    } catch (error) {
      console.error('Error creating stock history:', error);
      throw error;
    }
  }

  /**
   * Get all stocks with optional search and pagination
   */
  static async getAllStocks(params: {
    searchQuery?: string;
    perPage?: number;
    page?: number;
  }): Promise<StockInterface[]> {
    const db = await getDatabase();
    try {
      let query = `SELECT * FROM stocks`;
      const queryParams: any[] = [];

      if (params.searchQuery) {
        query += ` WHERE symbol LIKE ? OR name LIKE ? OR sku LIKE ?`;
        const searchPattern = `%${params.searchQuery}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }

      query += ` ORDER BY createdAt DESC`;

      if (params.perPage && params.page !== undefined) {
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(params.perPage, params.perPage * params.page);
      }

      const stocks = await db.getAllAsync(query, queryParams);
      return stocks as StockInterface[];
    } catch (error) {
      console.error('Error fetching stocks:', error);
      throw error;
    }
  }

  /**
   * Get stock by ID
   */
  static async getStockById(id: number): Promise<StockInterface | null> {
    const db = await getDatabase();
    try {
      const stock = await db.getFirstAsync(
        `SELECT * FROM stocks WHERE id = ?`,
        [id]
      );
      return stock as StockInterface | null;
    } catch (error) {
      console.error('Error fetching stock by ID:', error);
      throw error;
    }
  }

  /**
   * Create new stock
   */
  static async createStock(data: {
    name: string;
    symbol: string;
    sku: string;
    quantity: number;
  }): Promise<number> {
    const db = await getDatabase();
    try {
      const result = await db.runAsync(
        `INSERT INTO stocks (name, symbol, sku, quantity, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [data.name, data.symbol, data.sku, data.quantity]
      );

      const stockId = result.lastInsertRowId;

      // Create stock history for initial stock
      if (data.quantity > 0) {
        await this.createStockHistory(stockId, 'IN', data.quantity);
      }

      return stockId;
    } catch (error) {
      console.error('Error creating stock:', error);
      throw error;
    }
  }

  /**
   * Update stock
   */
  static async updateStock(
    id: number,
    data: {
      name?: string;
      symbol?: string;
      sku?: string;
      quantity?: number;
    }
  ): Promise<void> {
    const db = await getDatabase();
    try {
      // Get current stock to compare quantity
      const currentStock = await this.getStockById(id);
      if (!currentStock) {
        throw new Error('Stock not found');
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.symbol !== undefined) {
        updates.push('symbol = ?');
        values.push(data.symbol);
      }
      if (data.sku !== undefined) {
        updates.push('sku = ?');
        values.push(data.sku);
      }
      if (data.quantity !== undefined) {
        updates.push('quantity = ?');
        values.push(data.quantity);
      }

      updates.push('updatedAt = CURRENT_TIMESTAMP');
      values.push(id);

      await db.runAsync(
        `UPDATE stocks SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Create stock history if quantity changed
      if (data.quantity !== undefined && data.quantity !== currentStock.quantity) {
        const quantityDiff = data.quantity - currentStock.quantity;
        const transactionType: 'IN' | 'OUT' = quantityDiff > 0 ? 'IN' : 'OUT';
        await this.createStockHistory(id, transactionType, Math.abs(quantityDiff));
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  /**
   * Delete stock
   */
  static async deleteStock(id: number): Promise<void> {
    const db = await getDatabase();
    try {
      // Delete stock history first (foreign key constraint)
      await db.runAsync(
        `DELETE FROM stock_history WHERE StockId = ?`,
        [id]
      );

      // Delete stock
      await db.runAsync(
        `DELETE FROM stocks WHERE id = ?`,
        [id]
      );
    } catch (error) {
      console.error('Error deleting stock:', error);
      throw error;
    }
  }

  /**
   * Get stock history by stock ID
   */
  static async getStockHistory(stockId: number): Promise<StockHistoryInterface[]> {
    const db = await getDatabase();
    try {
      const history = await db.getAllAsync(
        `SELECT * FROM stock_history WHERE StockId = ? ORDER BY id DESC`,
        [stockId]
      );
      return history as StockHistoryInterface[];
    } catch (error) {
      console.error('Error fetching stock history:', error);
      throw error;
    }
  }

  /**
   * Adjust stock quantity (for manual stock adjustments)
   */
  static async adjustStock(
    id: number,
    quantityChange: number,
    transactionType: 'IN' | 'OUT'
  ): Promise<void> {
    const db = await getDatabase();
    try {
      const currentStock = await this.getStockById(id);
      if (!currentStock) {
        throw new Error('Stock not found');
      }

      const newQuantity = transactionType === 'IN' 
        ? currentStock.quantity + quantityChange
        : currentStock.quantity - quantityChange;

      if (newQuantity < 0) {
        throw new Error('Insufficient stock quantity');
      }

      await db.runAsync(
        `UPDATE stocks SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [newQuantity, id]
      );

      // Create stock history
      await this.createStockHistory(id, transactionType, quantityChange);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      throw error;
    }
  }

  /**
   * Update stock quantity (for production and sales)
   * @param id Stock ID
   * @param quantityChange Quantity to add (positive) or deduct (negative)
   * @param transactionType Transaction type
   * @param notes Optional notes for the transaction
   */
  static async updateStockQuantity(
    id: number,
    quantityChange: number,
    transactionType: 'IN' | 'OUT',
    notes?: string
  ): Promise<void> {
    const db = await getDatabase();
    try {
      const currentStock = await this.getStockById(id);
      if (!currentStock) {
        throw new Error('Stock not found');
      }

      const newQuantity = currentStock.quantity + quantityChange;

      if (newQuantity < 0) {
        throw new Error(`Insufficient stock for ${currentStock.name}`);
      }

      await db.runAsync(
        `UPDATE stocks SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [newQuantity, id]
      );

      // Create stock history
      await this.createStockHistory(id, transactionType, Math.abs(quantityChange));
    } catch (error) {
      console.error('Error updating stock quantity:', error);
      throw error;
    }
  }
}