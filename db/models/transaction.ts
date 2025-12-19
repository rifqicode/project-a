import { SQLiteDatabase } from "expo-sqlite";

export interface TransactionInterface {
    id: number;
    transactionNumber: string;
    total_amount: number;
    total_quantity: number;
    total_price: number;
    createdAt: string;
    updatedAt: string;
}

class Transaction {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transactionNumber TEXT,
                total_amount INTEGER,
                total_quantity INTEGER,
                total_price INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }
}

export default Transaction;
