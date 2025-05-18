import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

let _db: ReturnType<typeof drizzle> | null = null;
let _client: Database | null = null;

export function getDb() {
  if (!_db) {
    const file = process.env.DATABASE_URL || '../../tmp/ecommerce.db';
    logger.info(`\u2192 using sqlite database at ${file}`);
    _client = new Database(file);
    _db = drizzle(_client, { schema });
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
