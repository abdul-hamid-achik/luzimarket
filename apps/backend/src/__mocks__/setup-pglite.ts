// Vitest setup file for Drizzle + better-sqlite3 (in-memory SQLite)
import { afterAll, afterEach, beforeEach, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import Database from 'better-sqlite3';
import * as schema from '../schema';

process.env.DATABASE_URL = ':memory:';

let db: ReturnType<typeof drizzle>;
let client: Database;

vi.mock('@/db', async (importOriginal) => {
  client = new Database(':memory:');
  db = drizzle(client, { schema });
  return {
    ...(await importOriginal<typeof import('@/db')>()),
    db,
    client,
  };
});

// Create all tables before any tests run using migration SQL
import { beforeAll } from 'vitest';
import { readFile } from 'fs/promises';
beforeAll(async () => {
  const migrationSql = await readFile(require.resolve('../../drizzle/0000_init.sql'), 'utf8');
  // Split statements on drizzle's statement-breakpoint
  const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  for (const stmt of statements) {
    if (stmt.length > 0) {
      client.exec(stmt);
    }
  }
});

beforeEach(async () => {
  // Dynamically extract only table objects from schema
  const schemaModule = await import('../schema');
  const DRIZZLE_TABLE = Symbol.for('drizzle:SQLiteTable');
  const schemaTables = Object.fromEntries(
    Object.entries(schemaModule).filter(([, v]) => v && typeof v === 'object' && DRIZZLE_TABLE in v)
  );
  const tableNames = Object.values(schemaTables).map((t: any) => t.name);
  for (const table of tableNames) {
    try {
      client.exec(`DELETE FROM "${table}";`);
    } catch (err) {
      // Ignore if table doesn't exist
    }
  }
  // Minimal seed for categories, users, carts, products, and orders to satisfy FKs
  try { await db.insert(schema.categories).values({ id: 1, name: 'Default Category' }); } catch (e) {}
try { await db.insert(schema.categories).values({ id: 2, name: 'Second Category' }); } catch (e) {}
  try { await db.insert(schema.users).values({ id: 1, email: 'test@example.com', passwordHash: 'hashed', role: 'customer' }); } catch (e) {}
  try { await db.insert(schema.carts).values({ id: 1, userId: 1, createdAt: new Date() }); } catch (e) {}
  try { await db.insert(schema.products).values({ name: 'Seed Product', description: 'A product', price: '9.99', categoryId: 1, imageUrl: '', createdAt: new Date(), updatedAt: new Date() }); } catch (e) {}
  try { await db.insert(schema.orders).values({ userId: 1, total: '9.99', status: 'pending', createdAt: new Date(), updatedAt: new Date() }); } catch (e) {}
});

afterEach(async () => {
  // Optionally: reset schema or truncate tables
});

afterAll(async () => {
  await client.close();
});

