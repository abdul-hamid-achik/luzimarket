import * as dotenv from 'dotenv';
dotenv.config();

// Determine effective mode (fallback to offline if no DB URL)
const DB_MODE = process.env.DB_MODE || 'online';
let effectiveMode = DB_MODE;
if (DB_MODE !== 'offline' && !process.env.DATABASE_URL) {
    effectiveMode = 'offline';
}

// Export a function to get the correct schema
export async function getSchema() {
    if (effectiveMode === 'offline') {
        return await import('./schema.sqlite');
    } else {
        return await import('./schema.postgres');
    }
}

// For direct imports, re-export from the appropriate schema file
export * from './schema.sqlite';