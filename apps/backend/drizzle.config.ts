import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required for PostgreSQL database connection.');
}

// Only log in development/debug mode to avoid EPIPE errors during drizzle-kit commands
if (process.env.NODE_ENV === 'development' && process.env.DRIZZLE_DEBUG === 'true') {
    console.log('Using PostgreSQL database');
}

export default defineConfig({
    dialect: 'postgresql',
    schema: "./src/db/schema.postgres.ts",
    out: "./drizzle/postgres",
    dbCredentials: {
        url: DATABASE_URL,
    },
}); 