import { SQLiteDatabase } from "expo-sqlite";

export interface SettingInterface {
    name: string;
    value: string;
}

class Setting {
    static migrate(db: SQLiteDatabase) {
        db.execAsync(`
            CREATE TABLE IF NOT EXISTS settings (
                name TEXT PRIMARY KEY,
                value TEXT
            );
        `);
    }
}

export default Setting;
