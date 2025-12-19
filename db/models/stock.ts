import { SQLiteDatabase } from "expo-sqlite";

export interface StockInterface {
    id: number;
    name: string;
    symbol: string;
    sku: string;
    quantity: number;
    createdAt: string;
    updatedAt: string;
}

class Stock {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS stocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                symbol TEXT,
                sku TEXT,
                quantity INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }
}

export default Stock;