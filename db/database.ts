import Product from '@/db/models/product';
import ProductRecipes from '@/db/models/product_recipes';
import Setting from '@/db/models/setting';
import Stock from '@/db/models/stock';
import StockHistory from '@/db/models/stock_history';
import Transaction from '@/db/models/transaction';
import TransactionDetail from '@/db/models/transaction_detail';
import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

let db: SQLiteDatabase | null = null;

const runMigration = async (db: SQLiteDatabase) => {
    const migrations : { version: number; query: string; }[] = [];

    const result: { version: number; } | null = await db.getFirstAsync(`SELECT version FROM database_version ORDER BY id DESC LIMIT 1;`);
    let currentVersion = result ? result.version : 0;

    for (const migration of migrations) {
        if (migration.version && migration.version > currentVersion) {
            await db.execAsync(migration.query);
            currentVersion = migration.version;
            await db.execAsync(`UPDATE database_version SET version = ${currentVersion} WHERE id = (SELECT id FROM database_version ORDER BY id DESC LIMIT 1);`);
        }
    }
}

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
            db.execAsync(`
                CREATE TABLE IF NOT EXISTS database_version (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version INTEGER NOT NULL
                );
                insert into database_version (version) values (1);
            `)
        ]);

        // Running migrations for existing tables to update schema if needed
        await runMigration(db)
    }
    
    return db;
}

export async function closeDatabase() {
    if (db) {
        await db.closeAsync();
        db = null;
    }
}