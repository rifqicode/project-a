import { SQLiteDatabase } from "expo-sqlite";

export interface StockHistoryInterface {
    id: number;
    StockId: number;
    transactionType: 'IN' | 'OUT';
    quantity: number;
    createdAt: string;
    updatedAt: string;
}

class StockHistory {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS stock_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                StockId INTEGER NOT NULL,
                transactionType TEXT CHECK( transactionType IN ('IN', 'OUT') ) NOT NULL,
                quantity INTEGER NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }
}

export default StockHistory;