import { createDatabase, createLocalDatabase } from '@tinacms/datalayer';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import DrizzleAdapter from './drizzle-adapter';
import { FileSystemProvider } from 'tinacms-gitprovider-filesystem';

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';

export default isLocal
  ? createLocalDatabase()
  : createDatabase({
      gitProvider: new FileSystemProvider({ rootPath: process.cwd() }),
      databaseAdapter: new DrizzleAdapter(
        drizzle(new Pool({ connectionString: process.env.DATABASE_URL }))
      ),
    });