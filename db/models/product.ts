import { SQLiteDatabase } from "expo-sqlite";

export interface ProductInterface {
    id: number;
    nama: string;
    code: string;
    price: number;
    isHaveRecipes: boolean;
}

class Product {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nama TEXT,
                code TEXT,
                price REAL,
                isHaveRecipes BOOLEAN
            );
        `);
    }
}

export default Product;