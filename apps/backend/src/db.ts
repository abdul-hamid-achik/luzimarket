import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import dotenv from 'dotenv';
import logger from './logger';
import { createClient } from '@libsql/client';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';

dotenv.config();

let _db: ReturnType<typeof drizzle> | ReturnType<typeof drizzleLibsql> | null = null;
let _client: any | null = null;

export function getDb() {
  if (!_db) {
    if (process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN) {
      logger.info(`\u2192 using Turso at ${process.env.TURSO_CONNECTION_URL}`);
      const client = createClient({
        url: process.env.TURSO_CONNECTION_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });
      _db = drizzleLibsql(client, { schema });
    } else {
      const file = process.env.DATABASE_URL || '../../tmp/ecommerce.db';
      logger.info(`\u2192 using sqlite database at ${file}`);
      _client = new Database(file);
      _db = drizzle(_client, { schema });
    }
  }
  return _db;
}

export const db = getDb();

export async function closePool() {
  if (_client) {
    _client.close();
    _client = null;
    _db = null;
  }
}

process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);
