import request from 'supertest';
import app from '../app';
import { reset, seed } from 'drizzle-seed';
import * as schema from '@/schema';
import { Categories } from '@/data/categoriesData';
import type { CategorySeed } from '@/data/categoriesData';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

let pool: Pool;

beforeAll(async () => {
    // Connect to local test database; adjust URL as needed or rely on env vars
    const connectionString =
        process.env.LOCAL_POSTGRES_URL || process.env.DATABASE_URL ||
        'postgres://postgres:password@localhost:5433/ecommerce';
    pool = new Pool({ connectionString });
    const db = drizzle(pool);
    // Reset and seed the database
    await reset(db, schema);
    await seed(db, schema);
});

afterAll(async () => {
    await pool.end();
});

describe('Category API', () => {
    test('GET /api/categories should return all seeded categories', async () => {
        const res = await request(app).get('/api/categories');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // number of items matches seed
        expect(res.body).toHaveLength(Categories.length);
        // names match seeded values
        const names = res.body.map((c: CategorySeed) => c.name);
        expect(names).toEqual(expect.arrayContaining(Categories.map(c => c.name)));
    });
}); 