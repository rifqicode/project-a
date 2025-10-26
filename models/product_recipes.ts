import { SQLiteDatabase } from "expo-sqlite";

export interface ProductRecipeInterface {
    id: number;
    ProductId: number;
    StockId: number;
    amount: number;
}

class ProductRecipe {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS product_recipes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ProductId INTEGER,
                StockId INTEGER,
                amount REAL
            );
        `);
    }
}

export default ProductRecipe;
