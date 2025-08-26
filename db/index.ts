import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Use global to persist across hot reloads in development and function invocations in production
const globalForDb = globalThis as unknown as {
  _db: PostgresJsDatabase<typeof schema> | undefined;
  _client: ReturnType<typeof postgres> | undefined;
};

let _db = globalForDb._db;
let _client = globalForDb._client;

function getDatabase(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    // For seeding and development, load .env.local if DATABASE_URL is not set
    if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
      require('dotenv').config({ path: '.env.local' });
    }

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }

    // Configure connection pool settings optimized for Vercel serverless
    // In serverless, we want fewer connections per instance since many instances may be created
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
    const poolConfig = {
      max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : (isVercel ? 1 : 10), // 1 connection per serverless instance
      idle_timeout: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : (isVercel ? 10 : 20), // shorter timeout on Vercel
      connect_timeout: process.env.DB_CONNECT_TIMEOUT ? parseInt(process.env.DB_CONNECT_TIMEOUT) : 5, // faster timeout
      max_lifetime: isVercel ? 60 * 10 : 60 * 30, // 10 minutes on Vercel, 30 minutes locally
    };

    // Allow self-signed certs for Neon Local / localhost when explicitly indicated
    try {
      const url = new URL(databaseUrl);
      const isLocalHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      const allowSelfSigned = process.env.PGSSLMODE === 'no-verify' || process.env.NEON_LOCAL === '1' || isLocalHost;
      
      _client = allowSelfSigned
        ? postgres(databaseUrl, { 
            ...poolConfig,
            ssl: { rejectUnauthorized: false } as any,
            prepare: false // Disable prepared statements for better connection reuse
          })
        : postgres(databaseUrl, {
            ...poolConfig,
            prepare: false
          });
    } catch {
      // Fallback without URL parse
      const allowSelfSigned = process.env.PGSSLMODE === 'no-verify' || process.env.NEON_LOCAL === '1';
      _client = allowSelfSigned
        ? postgres(databaseUrl, { 
            ...poolConfig,
            ssl: { rejectUnauthorized: false } as any,
            prepare: false
          })
        : postgres(databaseUrl, {
            ...poolConfig,
            prepare: false
          });
    }
    _db = drizzle(_client, { schema });
    
    // Store in global for persistence across function invocations
    globalForDb._db = _db;
    globalForDb._client = _client;
  }
  return _db;
}

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(target, prop) {
    const database = getDatabase();
    return database[prop as keyof PostgresJsDatabase<typeof schema>];
  }
});

// Export a direct database instance for auth adapter and other cases that need it
export function getDbInstance(): PostgresJsDatabase<typeof schema> {
  return getDatabase();
}

// Cleanup function to close database connections
export async function closeDatabase() {
  if (_client) {
    await _client.end();
    _client = undefined;
    _db = undefined;
    globalForDb._client = undefined;
    globalForDb._db = undefined;
  }
}

// Handle process termination gracefully (not needed in serverless but useful for local dev)
// Only register these handlers in Node.js runtime, not Edge runtime
if (typeof process !== 'undefined' && 
    process.env.NODE_ENV !== 'production' && 
    typeof process.on === 'function') {
  process.on('SIGINT', async () => {
    await closeDatabase();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await closeDatabase();
    process.exit(0);
  });
}