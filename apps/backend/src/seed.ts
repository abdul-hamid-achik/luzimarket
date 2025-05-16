import 'dotenv/config';
import { WebSocket } from 'ws';
import { neonConfig } from '@neondatabase/serverless';
// removed static drizzle import; we'll dynamically load the correct driver below
import * as schema from './schema';
import { reset, seed } from 'drizzle-seed';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { Sales } from './data/salesData';
// import { States as StateSeeds } from './data/statesData';
// import { AdminOrders } from './data/adminOrdersData';

// Always configure Neon HTTP/WebSocket proxy support in seed script
neonConfig.webSocketConstructor = WebSocket;
neonConfig.poolQueryViaFetch = true;
// Configure local HTTP/WebSocket proxy mapping for Drizzle HTTP driver
neonConfig.wsProxy = (host) => `${host}/v1`;
neonConfig.useSecureWebSocket = false;
neonConfig.pipelineTLS = false;
neonConfig.pipelineConnect = false;

async function main() {
  // Use LOCAL_POSTGRES_URL for local Docker Compose (maps to localhost:5433)
  const url = process.env.NODE_ENV === 'production'
    ? process.env.DATABASE_URL!
    : process.env.LOCAL_POSTGRES_URL || process.env.DATABASE_URL!;
  console.log('Connecting to database at', url);
  const { Pool } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const pool = new Pool({
    connectionString: url,
    // SSL fallback for Neon
    ...(url.includes('neon.tech') && { ssl: { rejectUnauthorized: false } }),
  });
  const db = drizzle(pool);

  try {
    // First check if tables exist
    console.log('Checking database schema...');
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'sales'
    `;

    const tableResult = await pool.query(tableCheckQuery);
    const salesTableExists = tableResult.rows.length > 0;

    // If the sales table doesn't exist, create schema instead of resetting it
    if (!salesTableExists) {
      console.log('Creating database schema...');
      try {
        // Check for migrations folder
        const fs = await import('fs');
        const path = await import('path');
        const migrationsPath = path.join(__dirname, 'migrations');

        if (fs.existsSync(migrationsPath)) {
          console.log('Running migrations...');
          await migrate(db, { migrationsFolder: migrationsPath });
        } else {
          console.log('No migrations folder found, creating schema from schema.ts...');

          // Create tables with proper structure based on the schema
          // Special case for sales table with proper columns
          console.log('Creating sales table with date and amount columns...');
          try {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS "sales" (
                id SERIAL PRIMARY KEY,
                date TIMESTAMP NOT NULL,
                amount INTEGER NOT NULL
              )
            `);
          } catch (err) {
            console.log('Error creating sales table, might already exist');
          }

          // Create other basic tables
          const otherTables = [
            'categories', 'products', 'product_variants', 'carts',
            'cart_items', 'orders', 'order_items', 'coupons'
          ];

          for (const tableName of otherTables) {
            console.log(`Creating table if not exists: ${tableName}`);
            try {
              await pool.query(`CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY)`);
            } catch (err) {
              console.log(`Error creating table ${tableName}, might already exist`);
            }
          }
        }
      } catch (err) {
        console.error('Error creating schema:', err);
        console.log('Continuing with seeding anyway...');
      }
    } else {
      // Check if sales table has the right columns
      try {
        const columnsQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'sales'
          AND column_name IN ('date', 'amount')
        `;
        const columnsResult = await pool.query(columnsQuery);

        if (columnsResult.rows.length < 2) {
          console.log('Sales table exists but is missing required columns. Adding them...');

          const hasDate = columnsResult.rows.some((row: { column_name: string }) => row.column_name === 'date');
          const hasAmount = columnsResult.rows.some((row: { column_name: string }) => row.column_name === 'amount');

          if (!hasDate) {
            await pool.query(`ALTER TABLE sales ADD COLUMN date TIMESTAMP NOT NULL DEFAULT NOW()`);
          }

          if (!hasAmount) {
            await pool.query(`ALTER TABLE sales ADD COLUMN amount INTEGER NOT NULL DEFAULT 0`);
          }

          console.log('Sales table columns updated');
        }
      } catch (err) {
        console.error('Error checking/updating sales table columns:', err);
      }

      console.log('Schema already exists, skipping schema creation');
    }

    console.log('Seeding database with static arrays...');
    try {
      // Check if sales table has data
      const salesCountResult = await pool.query('SELECT COUNT(*) FROM sales');
      const hasSales = parseInt(salesCountResult.rows[0]?.count) > 0;

      if (!hasSales) {
        console.log('Seeding sales data directly via SQL...');

        // Insert sales data directly with SQL instead of using drizzle-seed
        const salesValues = Sales.map(sale => `('${sale.date}', ${sale.May})`).join(', ');

        if (salesValues.length > 0) {
          await pool.query(`
            INSERT INTO sales (date, amount)
            VALUES ${salesValues}
          `);
          console.log(`Inserted ${Sales.length} sales records`);
        }
      } else {
        console.log('Sales data already exists, skipping');
      }

      // Seed a default category and product for E2E tests
      try {
        const catCountRes = await pool.query('SELECT COUNT(*) FROM categories');
        const hasCategories = parseInt(catCountRes.rows[0].count) > 0;
        if (!hasCategories) {
          console.log('Seeding default category and product...');
          const catRes = await pool.query(
            "INSERT INTO categories (name, created_at) VALUES ('Default Category', NOW()) RETURNING id"
          );
          const catId = catRes.rows[0].id;
          await pool.query(
            `INSERT INTO products (name, description, price, category_id, image_url, created_at, updated_at) VALUES ('Sample Product', 'A seeded product', 19.99, $1, '', NOW(), NOW())`,
            [catId]
          );
          console.log('Seeded a sample category and product');
        }
      } catch (err) {
        console.error('Error seeding default category/product:', err);
      }
    } catch (err) {
      console.error('Error seeding data:', err);
      console.log('Continuing anyway...');
    }

    console.log('Seed completed');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    if (pool) {
      console.log('Closing pool');
      await pool.end();
    }
  }
}

main();