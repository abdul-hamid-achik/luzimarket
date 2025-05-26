// @ts-ignore: Allow importing dotenv without type declarations
import * as dotenv from 'dotenv';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as sqliteDrizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import * as fs from 'fs';
import * as sqliteSchema from './schema.sqlite';

// Global test database instances (only available during tests)
// eslint-disable-next-line no-var
declare global {
    // eslint-disable-next-line no-var
    var __TEST_DB_INSTANCE__: Database.Database | undefined;
    // eslint-disable-next-line no-var
    var __TEST_DRIZZLE_INSTANCE__: any | undefined;
}

dotenv.config();

const DB_MODE = process.env.DB_MODE || 'online';
// If no DATABASE_URL and not explicitly offline, fallback to offline mode (e.g. during tests)
let effectiveMode = DB_MODE;
if (DB_MODE !== 'offline' && !process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set, defaulting to offline SQLite mode.');
    effectiveMode = 'offline';
}
const DATABASE_URL = process.env.DATABASE_URL || '';

// Initialize database connection
function initializeDatabase(): any {
    console.log('[DB DEBUG] initializeDatabase() called');
    console.log('[DB DEBUG] NODE_ENV:', process.env.NODE_ENV);
    console.log('[DB DEBUG] DATABASE_URL:', process.env.DATABASE_URL);
    console.log('[DB DEBUG] DB_MODE:', process.env.DB_MODE);
    console.log('[DB DEBUG] Effective mode:', effectiveMode);

    if (effectiveMode === 'offline') {
        console.log('Using SQLite database for offline mode.');

        // Normal SQLite connection logic
        let sqliteDbPath: string;
        if (DATABASE_URL === ':memory:') {
            sqliteDbPath = ':memory:';
        } else if (DATABASE_URL && (DATABASE_URL.startsWith('file:') || DATABASE_URL.endsWith('.db') || DATABASE_URL.includes('sqlite'))) {
            // Use the provided DATABASE_URL for SQLite (file: URLs or .db files)
            sqliteDbPath = DATABASE_URL.startsWith('file:') ? DATABASE_URL.slice(5) : DATABASE_URL;
            // Ensure the directory exists
            const dir = path.dirname(sqliteDbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        } else {
            // Default to project-relative path if DATABASE_URL is not SQLite-compatible
            sqliteDbPath = path.resolve(process.cwd(), '../../tmp/db.sqlite');
        }

        console.log(`[DB DEBUG] Resolved sqliteDbPath: "${sqliteDbPath}"`);
        console.log(`[DB DEBUG] sqliteDbPath exists: ${fs.existsSync(sqliteDbPath)}`);

        const sqlite = new Database(sqliteDbPath);
        const drizzleDb = sqliteDrizzle(sqlite, { schema: sqliteSchema });

        if (sqliteDbPath === ':memory:') {
            console.log('Connected to in-memory SQLite database.');
        } else {
            console.log(`Connected to SQLite database at ${sqliteDbPath}.`);
        }
        return drizzleDb;
    } else { // This includes 'neon' or any other non-offline mode intended for PostgreSQL/Neon
        if (!DATABASE_URL) {
            throw new Error('DATABASE_URL is not set for non-offline (Neon/PostgreSQL) mode.');
        }
        const drizzleDb = neonDrizzle(DATABASE_URL);
        console.log('Connected to Neon database');
        return drizzleDb;
    }
}

// Lazy-initialize the database to allow for test setup
let _db: any = null;

function getDatabase(): any {
    // Always initialize fresh for tests to pick up new DATABASE_URL
    if (process.env.NODE_ENV === 'test') {
        console.log('[DB DEBUG] Test mode - creating fresh database connection');
        return initializeDatabase();
    }

    // In non-test mode, use caching as before
    if (!_db) {
        console.log('[DB DEBUG] Initializing database...');
        _db = initializeDatabase();
        console.log('[DB DEBUG] Database initialized:', typeof _db);
    }
    return _db;
}

// Helper function to reset database connection (useful for tests)
export function resetDatabaseConnection(): void {
    _db = null;
    console.log('[DB DEBUG] Database connection reset');
}

// Export the database instance as a getter
export const db = new Proxy(() => { }, {
    get(target, prop) {
        const database = getDatabase();
        const value = database[prop];
        return typeof value === 'function' ? value.bind(database) : value;
    },
    apply(target, thisArg, args) {
        return getDatabase().apply(thisArg, args);
    }
}) as any;