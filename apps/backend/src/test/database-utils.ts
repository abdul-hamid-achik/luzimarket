import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as sqliteSchema from '../db/schema.sqlite';
import fs from 'fs';
import path from 'path';

// Global in-memory database instance per test process
let globalInMemoryDb: Database.Database | null = null;
let globalDrizzleDb: any = null;

// Export the database instance for use by the main app during tests
declare global {
    var __TEST_DB_INSTANCE__: Database.Database | undefined;
    var __TEST_DRIZZLE_INSTANCE__: any | undefined;
}

/**
 * Creates a completely isolated in-memory SQLite database for testing
 * This avoids file locking issues and ensures complete test isolation
 */
export function createInMemoryDatabase(): { database: Database.Database, drizzle: any } {
    // Create in-memory SQLite database
    const database = new Database(':memory:');

    // Enable WAL mode for better concurrency (even though it's in-memory)
    database.pragma('journal_mode = WAL');
    database.pragma('synchronous = NORMAL');
    database.pragma('cache_size = 1000');
    database.pragma('foreign_keys = ON');

    // Create drizzle instance
    const drizzleInstance = drizzle(database, { schema: sqliteSchema });

    return { database, drizzle: drizzleInstance };
}

/**
 * Applies the SQLite schema to an in-memory database using Drizzle's built-in migrator
 * This dynamically finds the latest migration and uses Drizzle's native migration system
 */
export async function applySchemaToInMemoryDb(database: Database.Database): Promise<void> {
    try {
        // Create drizzle instance for migration
        const drizzleInstance = drizzle(database, { schema: sqliteSchema });

        // Path to the migrations directory (from drizzle.config.ts)
        const migrationsFolder = path.resolve(__dirname, '../../drizzle/sqlite');

        // Check if migrations folder exists and has migrations
        if (!fs.existsSync(migrationsFolder)) {
            throw new Error(`Migrations folder not found: ${migrationsFolder}`);
        }

        const migrationFiles = fs.readdirSync(migrationsFolder)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sort to get consistent order

        if (migrationFiles.length === 0) {
            throw new Error('No migration files found');
        }

        console.log(`📁 Found ${migrationFiles.length} migration file(s), using Drizzle migrator...`);
        console.log(`📁 Migration files: ${migrationFiles.join(', ')}`);

        // Use Drizzle's built-in migration system
        await migrate(drizzleInstance, { migrationsFolder });

        // Verify that tables were created by checking for key tables
        const tables = database.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `).all();

        const tableNames = tables.map((table: any) => table.name);
        console.log(`📋 Tables created: ${tableNames.join(', ')}`);

        // Check for essential tables
        const essentialTables = ['users', 'sessions', 'categories', 'products'];
        const missingTables = essentialTables.filter(table => !tableNames.includes(table));

        if (missingTables.length > 0) {
            throw new Error(`Essential tables missing after migration: ${missingTables.join(', ')}`);
        }

        console.log('✅ SQLite schema applied using Drizzle\'s built-in migrator');
        console.log(`✅ Verified ${tableNames.length} tables created successfully`);
    } catch (error) {
        console.error('❌ Failed to apply schema using Drizzle migrator:', error);
        throw error;
    }
}

/**
 * Seeds the in-memory database with test data
 * We'll create a simplified seed function specifically for testing
 */
export async function seedInMemoryDatabase(drizzleInstance: any): Promise<void> {
    try {
        // Import schema and ID generation for seeding
        const schema = await import('../db/schema.sqlite');
        const { generatePrefixedId, ID_PATTERNS } = await import('../lib/ids');

        // Simplified test users
        const testUsers = [
            {
                id: generatePrefixedId(ID_PATTERNS.USER),
                email: 'admin@test.com',
                password: 'hashedpassword',
                name: 'Test Admin',
                role: 'admin' as const
            },
            {
                id: generatePrefixedId(ID_PATTERNS.USER),
                email: 'customer@test.com',
                password: 'hashedpassword',
                name: 'Test Customer',
                role: 'customer' as const
            }
        ];

        // Insert test users
        for (const user of testUsers) {
            await drizzleInstance.insert(schema.users).values(user).onConflictDoNothing();
        }

        // Add a test category
        const testCategory = {
            id: generatePrefixedId(ID_PATTERNS.CATEGORY),
            name: 'Test Category',
            slug: 'test-category',
            description: 'A test category for testing'
        };

        await drizzleInstance.insert(schema.categories).values(testCategory).onConflictDoNothing();

        // Add test delivery zones
        const testDeliveryZones = [
            {
                id: generatePrefixedId(ID_PATTERNS.DELIVERY),
                name: 'Test Zone 1',
                fee: 5000,
                isActive: true,
                description: 'Test delivery zone 1'
            },
            {
                id: generatePrefixedId(ID_PATTERNS.DELIVERY),
                name: 'Test Zone 2',
                fee: 7500,
                isActive: true,
                description: 'Test delivery zone 2'
            },
            {
                id: generatePrefixedId(ID_PATTERNS.DELIVERY),
                name: 'Inactive Zone',
                fee: 8000,
                isActive: false,
                description: 'Test inactive delivery zone'
            }
        ];

        for (const zone of testDeliveryZones) {
            await drizzleInstance.insert(schema.deliveryZones).values(zone).onConflictDoNothing();
        }

        // Add a test product
        const testProduct = {
            id: generatePrefixedId(ID_PATTERNS.PRODUCT),
            name: 'Test Product',
            description: 'A test product for testing',
            price: 10000, // $100 in centavos
            slug: 'test-product',
            categoryId: testCategory.id
        };

        const insertedProduct = await drizzleInstance.insert(schema.products)
            .values(testProduct)
            .returning({ id: schema.products.id })
            .onConflictDoNothing();

        if (insertedProduct.length > 0) {
            // Add a product variant
            await drizzleInstance.insert(schema.productVariants).values({
                id: generatePrefixedId(ID_PATTERNS.VARIANT),
                productId: insertedProduct[0].id,
                sku: 'TEST-SKU-001',
                attributes: JSON.stringify({ size: 'M', color: 'Blue' }),
                stock: 10
            }).onConflictDoNothing();
        }

        console.log('✅ In-memory database seeded with test data');
    } catch (error) {
        console.error('❌ Failed to seed in-memory database:', error);
        throw error;
    }
}

/**
 * Gets or creates a global in-memory database for the current test process
 * This provides isolation per test process while sharing within the process
 */
export function getGlobalInMemoryDatabase(): { database: Database.Database, drizzle: any } {
    if (!globalInMemoryDb || !globalDrizzleDb) {
        const { database, drizzle } = createInMemoryDatabase();
        globalInMemoryDb = database;
        globalDrizzleDb = drizzle;

        // Make the instances available globally for the main app to use during tests
        global.__TEST_DB_INSTANCE__ = database;
        global.__TEST_DRIZZLE_INSTANCE__ = drizzle;
    }

    return { database: globalInMemoryDb, drizzle: globalDrizzleDb };
}

/**
 * Cleans up the global in-memory database
 */
export function cleanupGlobalInMemoryDatabase(): void {
    if (globalInMemoryDb) {
        try {
            globalInMemoryDb.close();
            console.log('✅ Global in-memory database closed');
        } catch (error) {
            console.warn('⚠️  Error closing global in-memory database:', error);
        }
        globalInMemoryDb = null;
        globalDrizzleDb = null;

        // Clear global instances
        global.__TEST_DB_INSTANCE__ = undefined;
        global.__TEST_DRIZZLE_INSTANCE__ = undefined;
    }
}

/**
 * Resets the in-memory database to a clean state
 * Useful between tests to ensure isolation
 */
export async function resetInMemoryDatabase(drizzleInstance: any): Promise<void> {
    try {
        // Drop all tables and recreate them
        const database = globalInMemoryDb;
        if (!database) {
            throw new Error('Global in-memory database not initialized');
        }

        // Get all table names
        const tables = database.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `).all();

        // Drop all tables
        for (const table of tables) {
            database.exec(`DROP TABLE IF EXISTS "${(table as any).name}"`);
        }

        // Reapply schema
        await applySchemaToInMemoryDb(database);

        // Reseed database
        await seedInMemoryDatabase(drizzleInstance);

        console.log('✅ In-memory database reset');
    } catch (error) {
        console.error('❌ Failed to reset in-memory database:', error);
        throw error;
    }
}

/**
 * Exports the in-memory database to a file for CI collection and analysis
 * This allows CI systems to collect the final test database state
 */
export async function exportInMemoryDbForCI(): Promise<string | null> {
    if (!process.env.CI || !globalInMemoryDb) {
        return null;
    }

    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sessionId = process.env.VITEST_SESSION_ID || 'unknown';
        const exportPath = path.resolve(process.cwd(), `../../tmp/test-results/test-session-${sessionId}/test-db-${timestamp}.db`);

        // Ensure the directory exists
        const dir = path.dirname(exportPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Use SQLite's backup API to copy in-memory DB to file
        globalInMemoryDb.backup(exportPath);

        console.log(`💾 Test database exported for CI: ${exportPath}`);
        return exportPath;
    } catch (error) {
        console.warn('⚠️  Failed to export test database for CI:', error);
        return null;
    }
}

/**
 * Registers cleanup handlers for process exit
 */
export function registerDatabaseCleanupHandlers(): void {
    const cleanup = async () => {
        // Export for CI before cleanup
        await exportInMemoryDbForCI();
        cleanupGlobalInMemoryDatabase();
    };

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', cleanup);
    process.on('unhandledRejection', cleanup);
}

/**
 * Creates a unique test database file per test session/file
 * This approach is simpler and avoids the complexity of shared instances
 */
export function createTestDatabaseFile(): { dbPath: string, cleanup: () => void } {
    const sessionId = process.env.VITEST_SESSION_ID || 'test';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const dbPath = path.resolve(process.cwd(), `../../tmp/test-results/test-session-${sessionId}/test-db-${timestamp}-${random}.db`);

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return {
        dbPath,
        cleanup: () => {
            try {
                if (fs.existsSync(dbPath)) {
                    fs.unlinkSync(dbPath);
                }
            } catch (error) {
                console.warn(`⚠️  Failed to cleanup test database: ${dbPath}`, error);
            }
        }
    };
}

/**
 * Sets up a complete test database with schema and seed data
 * Returns the database path that can be used with DATABASE_URL
 */
export async function setupTestDatabase(): Promise<{ dbPath: string, cleanup: () => void }> {
    const { dbPath, cleanup } = createTestDatabaseFile();

    try {
        // Create database and apply schema
        const database = new Database(dbPath);

        // Apply schema using Drizzle migrator
        const drizzleInstance = drizzle(database, { schema: sqliteSchema });
        const migrationsFolder = path.resolve(__dirname, '../../drizzle/sqlite');
        await migrate(drizzleInstance, { migrationsFolder });

        // Seed with test data
        await seedInMemoryDatabase(drizzleInstance);

        // Close the initial connection
        database.close();

        console.log(`✅ Test database created: ${dbPath}`);

        return { dbPath, cleanup };
    } catch (error) {
        // Clean up on error
        cleanup();
        throw error;
    }
} 