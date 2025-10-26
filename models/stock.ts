import { SQLiteDatabase } from "expo-sqlite";

export interface StockInterface {
    id: number;
    sku: string;
    symbol: string;
    quantity: number;
    purchase_price: number;
}

class Stock {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS stocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT,
                sku TEXT,
                quantity INTEGER,
                purchase_price REAL
            );
        `);
    }
}

export default Stock;