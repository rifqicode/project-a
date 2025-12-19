import Product from '@/db/models/product';
import ProductRecipes from '@/db/models/product_recipes';
import Setting from '@/db/models/setting';
import Stock from '@/db/models/stock';
import StockHistory from '@/db/models/stock_history';
import Transaction from '@/db/models/transaction';
import TransactionDetail from '@/db/models/transaction_detail';
import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

let db: SQLiteDatabase | null = null;
let isInitializing = false;
let initPromise: Promise<SQLiteDatabase> | null = null;

export async function getDatabase() {
    if (db) {
        return db;
    }

    // If already initializing, wait for that initialization to complete
    if (isInitializing && initPromise) {
        return initPromise;
    }

    isInitializing = true;
    initPromise = (async () => {
        try {
            const database = await openDatabaseAsync('app.db');
            
            // Migrate tables
            await Promise.all([
                Product.migrate(database),
                ProductRecipes.migrate(database),
                Stock.migrate(database),
                StockHistory.migrate(database),
                Transaction.migrate(database),
                Setting.migrate(database),
                TransactionDetail.migrate(database),
            ]);

            // Initialize database version table separately
            await database.execAsync(`
                CREATE TABLE IF NOT EXISTS database_version (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version INTEGER NOT NULL
                );
            `);

            // Check if version exists before inserting
            const versionExists = await database.getFirstAsync(
                'SELECT COUNT(*) as count FROM database_version'
            );
            
            if ((versionExists as any)?.count === 0) {
                await database.runAsync(
                    'INSERT INTO database_version (version) VALUES (?)',
                    [1]
                );
            }

            db = database;
            isInitializing = false;
            return database;
        } catch (error) {
            isInitializing = false;
            initPromise = null;
            throw error;
        }
    })();

    return initPromise;
}

export async function closeDatabase() {
    if (db) {
        await db.closeAsync();
        db = null;
    }
}