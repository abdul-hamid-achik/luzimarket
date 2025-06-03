import { writeFileSync } from 'fs';
import { sessionDir } from './config';
import path from 'path';

// Global teardown function
export async function globalTeardown() {
    const { globalCleanupTestServer } = await import('./api-client');

    await globalCleanupTestServer();

    console.log('✅ Global teardown complete');
}

// This runs once per test session
export default async function globalSetup() {
    console.log('🚀 Global setup starting...');

    // Skip Next.js build since we're using development mode for tests
    console.log('⏭️  Skipping Next.js build (using development mode for tests)');

    // Ensure DATABASE_URL is set for PostgreSQL testing
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL must be set for PostgreSQL testing');
    }

    console.log('⏭️  Using PostgreSQL database for tests');

    // Write test info to a file that the API client can read
    const testInfoPath = path.join(sessionDir, 'test-info.json');
    writeFileSync(testInfoPath, JSON.stringify({ database: 'postgresql' }), 'utf8');
    console.log(`📝 Test info written to: ${testInfoPath}`);

    console.log('🎯 Global setup complete!');

    // Register cleanup handler for process exit
    process.on('exit', async () => {
        await globalTeardown();
    });

    process.on('SIGINT', async () => {
        await globalTeardown();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await globalTeardown();
        process.exit(0);
    });
} 