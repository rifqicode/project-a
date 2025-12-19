import { getDatabase } from '../database';
import { TransactionInterface } from '../models/transaction';
import { TransactionDetailInterface } from '../models/transaction_detail';

interface CreateTransactionInput {
  products: {
    ProductId: number;
    quantity: number;
    amount: number;
  }[];
}

interface TransactionWithDetails extends TransactionInterface {
  details: (TransactionDetailInterface & { productName: string; productIcon: string })[];
}

export class TransactionService {
  /**
   * Generate unique transaction number
   */
  static async generateTransactionNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `TRX-${year}${month}${day}-${timestamp}`;
  }

  /**
   * Create new transaction with details
   */
  static async createTransaction(input: CreateTransactionInput): Promise<number> {
    const db = await getDatabase();
    const transactionNumber = await this.generateTransactionNumber();
    
    // Calculate totals
    let totalAmount = 0;
    let totalQuantity = 0;
    let totalPrice = 0;

    for (const product of input.products) {
      const subtotal = product.amount * product.quantity;
      totalAmount += product.amount;
      totalQuantity += product.quantity;
      totalPrice += subtotal;
    }

    // Insert transaction
    const transactionResult = await db.runAsync(
      `INSERT INTO transactions (transactionNumber, total_amount, total_quantity, total_price, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [transactionNumber, totalAmount, totalQuantity, totalPrice]
    );

    const transactionId = transactionResult.lastInsertRowId;

    // Insert transaction details
    for (const product of input.products) {
      const subtotal = product.amount * product.quantity;
      await db.runAsync(
        `INSERT INTO transaction_details (TransactionId, ProductId, amount, quantity, total, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [transactionId, product.ProductId, product.amount, product.quantity, subtotal]
      );
    }

    return transactionId;
  }

  /**
   * Get all transactions
   */
  static async getAllTransactions(): Promise<TransactionInterface[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<TransactionInterface>(
      `SELECT * FROM transactions ORDER BY createdAt DESC`
    );
    return result;
  }

  /**
   * Get transaction by ID with details
   */
  static async getTransactionById(id: number): Promise<TransactionWithDetails | null> {
    const db = await getDatabase();
    // Get transaction
    const transaction = await db.getFirstAsync<TransactionInterface>(
      `SELECT * FROM transactions WHERE id = ?`,
      [id]
    );

    if (!transaction) {
      return null;
    }

    // Get transaction details with product info
    const details = await db.getAllAsync<TransactionDetailInterface & { productName: string; productIcon: string }>(
      `SELECT 
        td.*,
        p.name as productName,
        p.icon as productIcon
       FROM transaction_details td
       LEFT JOIN products p ON td.ProductId = p.id
       WHERE td.TransactionId = ?
       ORDER BY td.id`,
      [id]
    );

    return {
      ...transaction,
      details: details || []
    };
  }

  /**
   * Delete transaction and its details
   */
  static async deleteTransaction(id: number): Promise<void> {
    const db = await getDatabase();
    // Delete details first (foreign key constraint)
    await db.runAsync(
      `DELETE FROM transaction_details WHERE TransactionId = ?`,
      [id]
    );

    // Delete transaction
    await db.runAsync(
      `DELETE FROM transactions WHERE id = ?`,
      [id]
    );
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(): Promise<{
    totalTransactions: number;
    totalRevenue: number;
    totalItems: number;
  }> {
    const db = await getDatabase();
    const stats = await db.getFirstAsync<{
      totalTransactions: number;
      totalRevenue: number;
      totalItems: number;
    }>(
      `SELECT 
        COUNT(*) as totalTransactions,
        COALESCE(SUM(total_price), 0) as totalRevenue,
        COALESCE(SUM(total_quantity), 0) as totalItems
       FROM transactions`
    );

    return stats || { totalTransactions: 0, totalRevenue: 0, totalItems: 0 };
  }

  /**
   * Get transactions by date range
   */
  static async getTransactionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<TransactionInterface[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<TransactionInterface>(
      `SELECT * FROM transactions 
       WHERE date(createdAt) BETWEEN date(?) AND date(?)
       ORDER BY createdAt DESC`,
      [startDate, endDate]
    );
    return result;
  }
}
