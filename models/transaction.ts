import { SQLiteDatabase } from "expo-sqlite";

export interface TransactionDetailInterface {
    id: number;
    TransactionId: number;
    ProductId: number;
    number: string;
    amount: number;
    quantity: number;
    total: number;
    created_at: string;
    updated_at: string;
}

class Transaction {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS transaction_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                TransactionId INTEGER,
                ProductId INTEGER,
                number TEXT,
                amount REAL,
                quantity REAL,
                total REAL,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            );
        `);
    }
}

export default Transaction;
