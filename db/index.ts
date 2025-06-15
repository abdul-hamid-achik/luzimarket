import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// For seeding and development, load .env.local if DATABASE_URL is not set
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: '.env.local' });
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });