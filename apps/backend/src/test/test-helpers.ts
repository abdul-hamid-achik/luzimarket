import { beforeEach, afterEach, afterAll } from 'vitest';
import { cleanupTestListeners } from './test-setup';
import {
    getGlobalInMemoryDatabase,
    resetInMemoryDatabase,
    cleanupGlobalInMemoryDatabase,
    setupTestDatabase
} from './database-utils';
import { initializeTestServer, cleanupTestServer } from './api-client';

/**
 * Enhanced test setup that provides per-file database isolation
 * Each test file gets its own database file, which is faster for CI and easier to debug
 */
export function setupTestEnvironmentPerFile() {
    let dbCleanup: (() => void) | null = null;
    let originalDatabaseUrl: string | undefined;

    beforeEach(async () => {
        // Setup a unique test database file for this test file
        const { dbPath, cleanup } = await setupTestDatabase();
        dbCleanup = cleanup;

        // Override the DATABASE_URL for this test
        originalDatabaseUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = `file:${dbPath}`;

        // Initialize test server with the new database
        await initializeTestServer();

        console.log(`🗃️  Test database ready: ${dbPath}`);
    });

    afterEach(async () => {
        // Clean up test server
        await cleanupTestServer();

        // Restore original DATABASE_URL
        if (originalDatabaseUrl !== undefined) {
            process.env.DATABASE_URL = originalDatabaseUrl;
        } else {
            delete process.env.DATABASE_URL;
        }

        // Clean up database file
        if (dbCleanup) {
            dbCleanup();
            dbCleanup = null;
        }

        // Clean up any test-specific listeners
        cleanupTestListeners();
    });

    afterAll(async () => {
        // Final cleanup
        await cleanupTestServer();
        cleanupTestListeners();
    });
}

/**
 * Enhanced test setup that provides in-memory database isolation
 * and proper cleanup for each test
 */
export function setupTestEnvironment() {
    let dbInstance: any = null;

    beforeEach(async () => {
        // Initialize in-memory database for this test
        const { drizzle } = getGlobalInMemoryDatabase();
        dbInstance = drizzle;

        // Reset database to clean state
        await resetInMemoryDatabase(drizzle);

        // Initialize test server
        await initializeTestServer();
    });

    afterEach(async () => {
        // Clean up test server
        await cleanupTestServer();

        // Clean up any test-added event listeners
        cleanupTestListeners();

        // Reset database for next test
        if (dbInstance) {
            await resetInMemoryDatabase(dbInstance);
        }
    });

    afterAll(async () => {
        // Final cleanup
        cleanupGlobalInMemoryDatabase();
    });

    return {
        getDatabase: () => {
            const { drizzle } = getGlobalInMemoryDatabase();
            return drizzle;
        }
    };
}

/**
 * Lightweight test setup for tests that don't need database reset between tests
 * Good for read-only tests or when you want to manage database state manually
 */
export function setupLightweightTestEnvironment() {
    let dbInstance: any = null;

    beforeEach(async () => {
        // Initialize test server
        await initializeTestServer();

        // Get database instance but don't reset it
        const { drizzle } = getGlobalInMemoryDatabase();
        dbInstance = drizzle;
    });

    afterEach(async () => {
        // Clean up test server
        await cleanupTestServer();

        // Clean up any test-added event listeners
        cleanupTestListeners();
    });

    afterAll(async () => {
        // Final cleanup
        cleanupGlobalInMemoryDatabase();
    });

    return {
        getDatabase: () => {
            const { drizzle } = getGlobalInMemoryDatabase();
            return drizzle;
        }
    };
}

/**
 * Test setup specifically for API route testing
 * Includes server initialization and database reset
 */
export function setupApiTestEnvironment() {
    return setupTestEnvironment();
}

/**
 * Test setup for database-only tests (no server needed)
 * Useful for testing database models, migrations, etc.
 */
export function setupDatabaseOnlyTestEnvironment() {
    let dbInstance: any = null;

    beforeEach(async () => {
        // Initialize in-memory database for this test
        const { drizzle } = getGlobalInMemoryDatabase();
        dbInstance = drizzle;

        // Reset database to clean state
        await resetInMemoryDatabase(drizzle);
    });

    afterEach(async () => {
        // Clean up any test-added event listeners
        cleanupTestListeners();

        // Reset database for next test
        if (dbInstance) {
            await resetInMemoryDatabase(dbInstance);
        }
    });

    afterAll(async () => {
        // Final cleanup
        cleanupGlobalInMemoryDatabase();
    });

    return {
        getDatabase: () => {
            const { drizzle } = getGlobalInMemoryDatabase();
            return drizzle;
        }
    };
}

/**
 * Utility to manually reset the database during a test
 * Useful when you need a clean slate in the middle of a test
 */
export async function resetTestDatabase() {
    const { drizzle } = getGlobalInMemoryDatabase();
    await resetInMemoryDatabase(drizzle);
}

/**
 * Utility to get direct access to the in-memory database
 */
export function getTestDatabase() {
    const { drizzle } = getGlobalInMemoryDatabase();
    return drizzle;
} 