import { defineConfig, type Config } from "drizzle-kit";
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DB_MODE = process.env.DB_MODE || 'online'; // Default to 'online' for postgresql
// Load DATABASE_URL for Postgres or SQLite if provided
const DATABASE_URL = process.env.DATABASE_URL || '';

// Only log in development/debug mode to avoid EPIPE errors during drizzle-kit commands
if (process.env.NODE_ENV === 'development' && process.env.DRIZZLE_DEBUG === 'true') {
    console.log(`DB_MODE: ${DB_MODE}`);
    console.log(`DATABASE_URL: ${DATABASE_URL ? 'Set' : 'Not set'}`);
}

let config: Config;

if (DB_MODE === 'offline') {
    // SQLite configuration for offline mode
    // Note: For tests, each test file creates its own database
    // This fallback is for development/migration purposes only
    const sqliteUrl = DATABASE_URL || path.resolve(__dirname, '../../tmp/dev-db.sqlite');
    if (process.env.NODE_ENV === 'development' && process.env.DRIZZLE_DEBUG === 'true') {
        console.log(`Using SQLite database at: ${sqliteUrl}`);
    }
    config = {
        dialect: 'sqlite',
        schema: "./src/db/schema.sqlite.ts", // Point to SQLite schema
        out: "./drizzle/sqlite",
        dbCredentials: {
            url: sqliteUrl, // Use env var or default to development database
        },
    };
} else {
    // PostgreSQL configuration for 'neon' or any other mode
    if (process.env.NODE_ENV === 'development' && process.env.DRIZZLE_DEBUG === 'true') {
        console.log(`Using PostgreSQL database`);
    }
    config = {
        dialect: 'postgresql',
        schema: "./src/db/schema.postgres.ts", // Point to PostgreSQL schema
        out: "./drizzle/postgres",
        dbCredentials: {
            url: DATABASE_URL,
        },
    };
}

export default defineConfig(config); 