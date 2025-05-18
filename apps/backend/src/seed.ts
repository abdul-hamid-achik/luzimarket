import 'dotenv/config';
import { getDb, closePool } from './db';
import * as schema from './schema';
import axios from 'axios';
import { seed } from 'drizzle-seed';

function randomDateWithinDays(daysAgo: number) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  return new Date(now - Math.floor(Math.random() * daysAgo) * oneDay);
}

async function main() {
  const db = getDb();
  console.log(`🔧 Seeding ${process.env.TURSO_CONNECTION_URL ? 'Turso' : 'SQLite'} database`);

  // Fetch product and variant IDs from Strapi CMS
  const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
  const { data: productsRes } = await axios.get(
    `${strapiUrl}/api/products?populate=variants&pagination[pageSize]=1000`
  );
  const productsData = productsRes.data;
  const productIds = productsData.map((p: any) => p.id.toString());
  const variantIds = productsData.flatMap((p: any) =>
    p.attributes.variants.data.map((v: any) => v.id.toString())
  );

  // Seed database using drizzle-seed
  await seed(db, schema, { seed: parseInt(process.env.SEED || '12345', 10) })
    .refine((f) => ({
      sales: {
        count: 365,
        columns: {
          date: f.date({
            minDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            maxDate: new Date(),
          }),
          amount: f.int({ minValue: 100, maxValue: 1000 }),
        },
      },
      coupons: {
        count: 50,
        columns: {
          code: f.string({ length: 10 }),
          discountPercent: f.int({ minValue: 5, maxValue: 50 }),
          expiresAt: f.date({
            minDate: new Date(),
            maxDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          }),
        },
      },
      carts: {
        count: 200,
        with: {
          cartItems: f.weightedRandom([
            { weight: 0.7, count: [1, 2, 3] },
            { weight: 0.2, count: [4, 5] },
            { weight: 0.1, count: [6, 7, 8] },
          ]),
        },
        columns: {
          userId: f.valuesFromArray({ values: ['user_1', 'user_2', null] }),
          guestId: f.valuesFromArray({ values: [null, 'guest_abc', 'guest_xyz'] }),
          createdAt: f.date({
            minDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            maxDate: new Date(),
          }),
        },
      },
      orders: {
        count: 500,
        with: {
          orderItems: f.weightedRandom([
            { weight: 0.5, count: [1, 2, 3] },
            { weight: 0.3, count: [4, 5, 6] },
            { weight: 0.2, count: [7, 8, 9, 10] },
          ]),
        },
        columns: {
          status: f.valuesFromArray({ values: ['pending', 'completed', 'cancelled'] }),
          createdAt: f.date({
            minDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            maxDate: new Date(),
          }),
          updatedAt: f.date({
            minDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            maxDate: new Date(),
          }),
        },
      },
      cartItems: {
        columns: {
          productId: f.valuesFromArray({ values: productIds }),
          variantId: f.valuesFromArray({ values: [null, ...variantIds] }),
          quantity: f.int({ minValue: 1, maxValue: 5 }),
        },
      },
      orderItems: {
        columns: {
          productId: f.valuesFromArray({ values: productIds }),
          variantId: f.valuesFromArray({ values: [null, ...variantIds] }),
          quantity: f.int({ minValue: 1, maxValue: 5 }),
          price: f.number({ minValue: 10, maxValue: 500 }),
        },
      },
    }));

  await closePool();
}

main().catch(err => {
  console.error('❌ Seed error', err);
  process.exit(1);
});
