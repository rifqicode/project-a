import { SQLiteDatabase } from "expo-sqlite";

export interface StockHistoryInterface {
    id: number;
    StockId: number;
    transactionType: 'IN' | 'OUT';
    quantity: number;
}

class StockHistory {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS stock_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                StockId INTEGER NOT NULL,
                transactionType TEXT CHECK( transactionType IN ('IN', 'OUT') ) NOT NULL,
                quantity INTEGER NOT NULL,
                FOREIGN KEY (StockId) REFERENCES stocks(id)
            );
        `);
    }
}

export default StockHistory;