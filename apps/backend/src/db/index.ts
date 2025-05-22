// @ts-ignore: Allow importing dotenv without type declarations
import * as dotenv from 'dotenv';
import { drizzle as neonDrizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import { drizzle as sqliteDrizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import * as fs from 'fs';

dotenv.config();

const DB_MODE = process.env.DB_MODE || 'online';
// If no DATABASE_URL and not explicitly offline, fallback to offline mode (e.g. during tests)
let effectiveMode = DB_MODE;
if (DB_MODE !== 'offline' && !process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set, defaulting to offline SQLite mode.');
    effectiveMode = 'offline';
}
const DATABASE_URL = process.env.DATABASE_URL || '';

let db: NeonDatabase | BetterSQLite3Database;

if (effectiveMode === 'offline') {
    console.log('Using SQLite database for offline mode.');
    // Determine SQLite DB path: use ':memory:' if requested, else use existing DATABASE_URL path or default to project tmp/db.sqlite
    let sqliteDbPath: string;
    if (DATABASE_URL === ':memory:') {
        sqliteDbPath = ':memory:';
    } else if (DATABASE_URL && fs.existsSync(DATABASE_URL)) {
        sqliteDbPath = DATABASE_URL;
    } else {
        sqliteDbPath = path.resolve(process.cwd(), '../../tmp/db.sqlite');
    }
    console.log(`[DB DEBUG] __dirname: ${__dirname}`);
    console.log(`[DB DEBUG] DATABASE_URL: "${DATABASE_URL}"`);
    console.log(`[DB DEBUG] Resolved sqliteDbPath: "${sqliteDbPath}"`);
    console.log(`[DB DEBUG] sqliteDbPath directory exists: ${fs.existsSync(path.dirname(sqliteDbPath))}`);
    const sqlite = new Database(sqliteDbPath);
    db = sqliteDrizzle(sqlite);
    if (sqliteDbPath === ':memory:') {
        console.log('Connected to in-memory SQLite database.');
    } else {
        console.log(`Connected to SQLite database at ${sqliteDbPath}.`);
    }
} else { // This includes 'neon' or any other non-offline mode intended for PostgreSQL/Neon
    if (!DATABASE_URL) {
        throw new Error('DATABASE_URL is not set for non-offline (Neon/PostgreSQL) mode.');
    }
    db = neonDrizzle(DATABASE_URL);
    console.log('Connected to Neon database');
}

export { db };