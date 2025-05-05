import 'dotenv/config';
import { WebSocket } from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { URL } from 'url';
// removed static drizzle import; we'll dynamically load the correct driver below
import * as schema from '@/schema';
import { reset, seed } from 'drizzle-seed';
import { Categories } from '@/data/categoriesData';
import { Products } from '@/data/productsData';
import { Sales } from '@/data/salesData';
import { States as StateSeeds } from '@/data/statesData';
import { AdminOrders } from '@/data/adminOrdersData';

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
    console.log('Resetting database...');
    await reset(db, schema);

    console.log('Seeding database with static arrays...');
    await seed(db, schema).refine((f: any) => ({
      categories: {
        count: Categories.length,
        columns: { name: f.valuesFromArray({ values: Categories.map(c => c.name), isUnique: true }) },
      },
      products: {
        count: Products.length,
        columns: {
          name: f.valuesFromArray({ values: Products.map(p => p.name), isUnique: true }),
          description: f.valuesFromArray({ values: Products.map(p => p.description) }),
          price: f.valuesFromArray({ values: Products.map(p => p.price) }),
          categoryId: f.valuesFromArray({ values: Products.map(p => Categories.findIndex(c => c.name === p.category) + 1) }),
          imageUrl: f.valuesFromArray({ values: Products.map(p => p.imageUrl) }),
        },
      },
      sales: {
        count: Sales.length,
        columns: {
          date: f.valuesFromArray({ values: Sales.map(s => new Date(s.date)) }),
          amount: f.valuesFromArray({ values: Sales.map(s => s.May) }),
        },
      },
      states: {
        count: StateSeeds.length,
        columns: {
          value: f.valuesFromArray({ values: StateSeeds.map(s => s.value), isUnique: true }),
          label: f.valuesFromArray({ values: StateSeeds.map(s => s.label), isUnique: true }),
        },
      },
      adminOrders: {
        count: AdminOrders.length,
        columns: {
          id: f.valuesFromArray({ values: AdminOrders.map(o => o.id), isUnique: true }),
          total: f.valuesFromArray({ values: AdminOrders.map(o => o.total) }),
          cliente: f.valuesFromArray({ values: AdminOrders.map(o => o.cliente) }),
          estadoPago: f.valuesFromArray({ values: AdminOrders.map(o => o.estadoPago) }),
          estadoOrden: f.valuesFromArray({ values: AdminOrders.map(o => o.estadoOrden) }),
          tipoEnvio: f.valuesFromArray({ values: AdminOrders.map(o => o.tipoEnvio) }),
          fecha: f.valuesFromArray({ values: AdminOrders.map(o => o.fecha) }),
        },
      },
    }));

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