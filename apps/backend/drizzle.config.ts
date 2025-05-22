import { defineConfig, type Config } from "drizzle-kit";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const DB_MODE = process.env.DB_MODE || 'online'; // Default to 'online' for postgresql
// Load DATABASE_URL for Postgres or SQLite if provided
const DATABASE_URL = process.env.DATABASE_URL || '';

let config: Config;

if (DB_MODE === 'offline') {
    // SQLite configuration for offline mode
    const sqliteUrl = path.resolve(__dirname, '../../tmp/db.sqlite');
    console.log(`Using SQLite database at: ${sqliteUrl}`);
    config = {
        dialect: 'sqlite',
        schema: "./src/db/schema.sqlite.ts", // Point to SQLite schema
        out: "./drizzle/sqlite",
        dbCredentials: {
            url: sqliteUrl, // Use env var or default to project tmp/db.sqlite
        },
    };
} else {
    // PostgreSQL configuration for 'neon' or any other mode
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