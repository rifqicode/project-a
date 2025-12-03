import { SQLiteDatabase } from "expo-sqlite";

export interface TransactionDetailInterface {
    id: number;
    TransactionId: number;
    ProductId: number;
    amount: number;
    quantity: number;
    total: number;
    created_at: string;
    updated_at: string;
}

class TransactionDetail {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS transaction_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                TransactionId INTEGER,
                ProductId INTEGER,
                amount REAL,
                quantity REAL,
                total REAL,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            );
        `);
    }
}

export default TransactionDetail;
