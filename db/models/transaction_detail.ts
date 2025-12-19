import { SQLiteDatabase } from "expo-sqlite";

export interface TransactionDetailInterface {
    id: number;
    TransactionId: number;
    ProductId: number;
    amount: number;
    quantity: number;
    total: number;
    createdAt: string;
    updatedAt: string;
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
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }
}

export default TransactionDetail;
