import { createDatabase } from '@tinacms/datalayer';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import DrizzleAdapter from './drizzle-adapter';

// Initialize database client using our custom DrizzleAdapter
const databaseClient = createDatabase({
  databaseAdapter: new DrizzleAdapter(
    drizzle(new Pool({ connectionString: process.env.DATABASE_URL }))
  ),
});

export default databaseClient;