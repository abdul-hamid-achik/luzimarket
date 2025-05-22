// @ts-ignore: Allow importing dotenv without type declarations
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePGLite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';

dotenv.config();

// Get database mode from environment variable - defaults to "neon"
const DB_MODE = process.env.DB_MODE || 'neon';
const DATABASE_URL = process.env.DATABASE_URL || '';

let db;

if (DB_MODE === 'pglite') {
    // Use PGlite for offline/testing mode
    const pgliteConfig = DATABASE_URL.startsWith('./') || DATABASE_URL.startsWith('/')
        ? { dataDir: DATABASE_URL } // File-based storage
        : {}; // In-memory storage if no path provided

    const client = new PGlite(pgliteConfig);
    db = drizzlePGLite({ client });
    console.log('Connected to PGlite database');
} else {
    // Use Neon for production/development mode
    db = drizzle(DATABASE_URL);
    console.log('Connected to Neon database');
}

export { db }; 