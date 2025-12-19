import { SQLiteDatabase } from "expo-sqlite";

export interface ProductInterface {
    id: number;
    icon: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    isHaveRecipes: boolean;
    createdAt: string;
    updatedAt: string;
}

class Product {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                icon TEXT,
                name TEXT,
                sku TEXT,
                price INTEGER,
                stock INTEGER,
                isHaveRecipes BOOLEAN,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }
}

export default Product;