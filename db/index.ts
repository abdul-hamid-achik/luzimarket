import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

let _db: PostgresJsDatabase<typeof schema> | null = null;

function getDatabase(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    // For seeding and development, load .env.local if DATABASE_URL is not set
    if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
      require('dotenv').config({ path: '.env.local' });
    }

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set');
    }

    const client = postgres(process.env.DATABASE_URL);
    _db = drizzle(client, { schema });
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