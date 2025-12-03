import { getDatabase } from "../database";
import { StockInterface } from "../models/stock";

export class StockService {
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
        query += ` WHERE symbol LIKE ? OR name LIKE ?`;
        const searchPattern = `%${params.searchQuery}%`;
        queryParams.push(searchPattern, searchPattern);
      }

      query += ` ORDER BY symbol ASC`;

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
}