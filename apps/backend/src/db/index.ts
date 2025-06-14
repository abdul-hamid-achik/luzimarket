import * as dotenv from 'dotenv';
import * as path from 'path';
import { drizzle } from 'drizzle-orm/neon-serverless';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    // During build time, DATABASE_URL might not be available
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
        console.warn('DATABASE_URL is not set, database operations will fail');
    } else if (process.env.NODE_ENV !== 'production') {
        throw new Error('DATABASE_URL is required for PostgreSQL database connection.');
    }
}

// Initialize database connection
function initializeDatabase() {
    if (!DATABASE_URL) {
        console.warn('DATABASE_URL not available, returning null database instance');
        return null;
    }

    const drizzleDb = drizzle(DATABASE_URL);
    return drizzleDb;
}

// Lazy-initialize the database
let _db: any = null;

function getDatabase(): any {
    // Always initialize fresh for tests to pick up new DATABASE_URL
    if (process.env.NODE_ENV === 'test') {
        return initializeDatabase();
    }

    // In non-test mode, use caching as before
    if (!_db) {
        _db = initializeDatabase();
    }

    if (!_db) {
        throw new Error('Database not available - DATABASE_URL might not be set');
    }

    return _db;
}

// Helper function to reset database connection (useful for tests)
export function resetDatabaseConnection(): void {
    _db = null;
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