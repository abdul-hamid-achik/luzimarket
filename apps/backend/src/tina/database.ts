import { createDatabase } from '@tinacms/datalayer';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import DrizzleAdapter from './drizzle-adapter';
import { GitHubProvider } from 'tinacms-gitprovider-github';

// Initialize database client using our custom DrizzleAdapter
const databaseClient = createDatabase({
  gitProvider: new GitHubProvider({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    branch: process.env.GIT_BRANCH || process.env.GITHUB_BRANCH!,
    token: process.env.GITHUB_PERSONAL_ACCESS_TOKEN!,
  }),
  databaseAdapter: new DrizzleAdapter(
    drizzle(new Pool({ connectionString: process.env.DATABASE_URL }))
  ),
});

export default databaseClient;