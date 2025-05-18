import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { randomUUID } from 'crypto';
import * as schema from './schema';
import { Sales } from './data/salesData';

function createSchema(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      guest_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now')*1000)
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON cart_items(cart_id);
    CREATE INDEX IF NOT EXISTS cart_items_product_id_idx ON cart_items(product_id);
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      total NUMERIC(12,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER DEFAULT (strftime('%s','now')*1000),
      updated_at INTEGER DEFAULT (strftime('%s','now')*1000)
    );
    CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER,
      quantity INTEGER NOT NULL,
      price NUMERIC(10,2) NOT NULL
    );
    CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      discount_percent INTEGER NOT NULL,
      expires_at INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS code_idx ON coupons(code);
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      date INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now')*1000)
    );
    CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(date);
  `);
}

async function main() {
  const file = process.env.DATABASE_URL || '../../tmp/ecommerce.db';
  console.log('Seeding SQLite database at', file);
  const client = new Database(file);
  createSchema(client);
  const db = drizzle(client, { schema });

  const countStmt = client.prepare('SELECT COUNT(*) as count FROM sales');
  const hasSales = countStmt.get().count > 0;
  if (!hasSales) {
    const insert = client.prepare('INSERT INTO sales (id, date, amount) VALUES (?, ?, ?)');
    const insertMany = client.transaction((rows) => {
      for (const sale of rows) {
        insert.run(randomUUID(), new Date(sale.date).getTime(), sale.May);
      }
    });
    insertMany(Sales);
    console.log(`Inserted ${Sales.length} sales records`);
  }

  const couponCount = client.prepare('SELECT COUNT(*) as count FROM coupons').get().count;
  if (!couponCount) {
    const coupons = [
      { code: 'WELCOME10', discount_percent: 10, expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000 },
      { code: 'SUMMER20', discount_percent: 20, expires_at: Date.now() + 60 * 24 * 60 * 60 * 1000 },
      { code: 'BLACKFRIDAY50', discount_percent: 50, expires_at: new Date('2025-11-29').getTime() },
    ];
    const insert = client.prepare('INSERT INTO coupons (id, code, discount_percent, expires_at) VALUES (?, ?, ?, ?)');
    const insertMany = client.transaction((rows) => {
      for (const c of rows) {
        insert.run(randomUUID(), c.code, c.discount_percent, c.expires_at);
      }
    });
    insertMany(coupons);
    console.log(`Inserted ${coupons.length} coupons`);
  }

  client.close();
  console.log('Seed completed');
}

main().catch(err => {
  console.error('Seed error', err);
  process.exit(1);
});
