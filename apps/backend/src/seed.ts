import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@/schema';
import { reset, seed } from 'drizzle-seed';
import { Categories } from '@/data/categoriesData';
import { Products } from '@/data/productsData';
import { Sales } from '@/data/salesData';
import { States as StateSeeds } from '@/data/statesData';
import { AdminOrders } from '@/data/adminOrdersData';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
    await pool.end();
  }
}

main();