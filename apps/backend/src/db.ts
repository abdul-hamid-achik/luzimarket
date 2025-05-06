import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { Pool } from "pg";
import dotenv from "dotenv";
import { WebSocket } from 'ws';
import { neonConfig } from '@neondatabase/serverless';

dotenv.config();

// Always configure Neon HTTP/WebSocket proxy support
neonConfig.webSocketConstructor = WebSocket;
neonConfig.poolQueryViaFetch = true;
// Configure local HTTP/WebSocket proxy mapping for Drizzle HTTP driver
neonConfig.wsProxy = (host) => `${host}/v1`;
neonConfig.useSecureWebSocket = false;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

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

    // Decide between HTTP (Neon via proxy) or Postgres driver
    const useHttpDriver =
      connectionString.startsWith('http://') ||
      connectionString.startsWith('https://') ||
      process.env.USE_NEON_HTTP === 'true';
    if (useHttpDriver) {
      // Use HTTP-based Neon driver
      _db = drizzleHttp(connectionString);
    } else {
      // Use Postgres pool
      const poolConfig: any = {
        connectionString,
        max,
        connectionTimeoutMillis: connectionTimeoutMs,
        idleTimeoutMillis: idleTimeoutMs,
        statement_timeout: 15000,
      };
      // Fallback SSL for Neon Postgres endpoints if needed
      if (connectionString.includes('neon.tech')) {
        poolConfig.ssl = { rejectUnauthorized: false };
      }
      _pool = new Pool(poolConfig);
      _pool.on('error', (err: Error) => {
        console.error('Unexpected Postgres pool error', err);
      });
      _db = drizzlePg(_pool);
    }
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