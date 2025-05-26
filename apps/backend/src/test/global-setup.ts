import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { sessionDir } from './config';
import {
    setupTestDatabase,
    cleanupGlobalInMemoryDatabase,
    registerDatabaseCleanupHandlers
} from './database-utils';

const isOfflineMode = process.env.DB_MODE === 'offline' || process.env.NODE_ENV === 'test';

// Global teardown function
export async function globalTeardown() {
    const { globalCleanupTestServer } = await import('./api-client');
    const { cleanupGlobalInMemoryDatabase } = await import('./database-utils');

    await globalCleanupTestServer();
    cleanupGlobalInMemoryDatabase();

    console.log('✅ Global teardown complete');
}

// This runs once per test session
export default async function globalSetup() {
    console.log('🚀 Global setup starting...');

    // Skip Next.js build since we're using development mode for tests
    console.log('⏭️  Skipping Next.js build (using development mode for tests)');

    if (isOfflineMode) {
        try {
            console.log('⚡ Setting up file-based SQLite database for test session...');

            // Register cleanup handlers for proper database shutdown
            registerDatabaseCleanupHandlers();

            // Create a file-based test database that the Next.js server can access
            const { dbPath, cleanup } = await setupTestDatabase();

            // Set the DATABASE_URL to point to the test database file
            process.env.DATABASE_URL = `file:${dbPath}`;
            console.log(`📊 Test database created at: ${dbPath}`);

            // Write database info to a file that the API client can read
            const dbInfoPath = path.join(sessionDir, 'test-db-info.json');
            writeFileSync(dbInfoPath, JSON.stringify({ dbPath }), 'utf8');
            console.log(`📝 Database info written to: ${dbInfoPath}`);

            // Store cleanup function for later
            (global as any).__TEST_DB_CLEANUP__ = cleanup;

            console.log('✅ File-based test database setup complete!');
        } catch (error) {
            console.error('❌ Global test database setup failed:', error);
            throw error;
        }
    } else {
        console.log('⏭️  Skipping database setup for online mode (using existing database)');
    }

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