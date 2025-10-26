import Product from '@/models/product';
import ProductRecipes from '@/models/product_recipes';
import Setting from '@/models/setting';
import Stock from '@/models/stock';
import StockHistory from '@/models/stock_history';
import Transaction from '@/models/transaction';
import TransactionDetail from '@/models/transaction_detail';
import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

let db: SQLiteDatabase | null = null;

export async function getDatabase() {
    if (!db) {
        db = await openDatabaseAsync('app.db');
        // Migrate tables
        await Promise.all([
            Product.migrate(db),
            ProductRecipes.migrate(db),
            Stock.migrate(db),
            StockHistory.migrate(db),
            Transaction.migrate(db),
            Setting.migrate(db),
            TransactionDetail.migrate(db),
        ]);
    }
    
    return db;
}
