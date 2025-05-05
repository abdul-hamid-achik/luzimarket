import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import { WebSocket } from 'ws';
import { neonConfig } from '@neondatabase/serverless';

dotenv.config();

// Configure Neon for serverless environments when in production
if (process.env.NODE_ENV === 'production') {
  neonConfig.webSocketConstructor = WebSocket;
  neonConfig.poolQueryViaFetch = true;
}

// Create a singleton for the database connection
let _db: any | null = null;
let _pool: any | null = null;

export function getDb() {
  if (!_db) {
    console.log('Initializing database connection pool');

    // Set timeout values that respect Vercel serverless constraints
    const connectionTimeoutMs = 10000; // 10 seconds
    const idleTimeoutMs = 10000; // 10 seconds
    const max = 1; // Limit pool size for serverless environment

    const connectionString = process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.LOCAL_POSTGRES_URL;

    if (!connectionString) {
      throw new Error('No database connection string provided');
    }

    // Always use Postgres driver/pool in non-serverless contexts
    _pool = new Pool({
      connectionString,
      max,
      connectionTimeoutMillis: connectionTimeoutMs,
      idleTimeoutMillis: idleTimeoutMs,
      statement_timeout: 15000,
    });
    // Add error listener for unexpected pool errors
    _pool.on('error', (err: Error) => {
      console.error('Unexpected Postgres pool error', err);
    });
    // Initialize db with the pool
    _db = drizzle(_pool);
  }

  return _db;
}

// Backwards compatibility for existing code
export const db = new Proxy({} as any, {
  get: (target, prop) => {
    const dbInstance = getDb();
    return dbInstance[prop as keyof typeof dbInstance];
  }
});

// Function to explicitly close the pool (useful for tests)
export async function closePool() {
  if (_pool) {
    console.log('Closing database connection pool');
    await _pool.end();
    _pool = null;
    _db = null;
  }
}

// Add graceful shutdown hooks to close the pool when the process exits
process.on('SIGTERM', async () => {
  console.log('SIGTERM received: closing database pool');
  await closePool();
});
process.on('SIGINT', async () => {
  console.log('SIGINT received: closing database pool');
  await closePool();
});