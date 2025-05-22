import { PGlite } from '@electric-sql/pglite';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

/**
 * This script sets up the PGlite database for testing
 * It runs all migrations from the drizzle directory
 */
async function setupPGlite() {
    try {
        const DATABASE_URL = process.env.DATABASE_URL || '';

        // Configure PGlite based on DATABASE_URL
        const pgliteConfig = DATABASE_URL.startsWith('./') || DATABASE_URL.startsWith('/')
            ? { dataDir: DATABASE_URL } // File-based storage
            : {}; // In-memory storage if no path provided

        console.log('Setting up PGlite database...');
        console.log('Database config:', pgliteConfig);

        // Initialize PGlite
        const client = new PGlite(pgliteConfig);

        // Read migrations from drizzle/meta/_journal.json
        const journalPath = path.join(__dirname, '../../drizzle/meta/_journal.json');
        if (!fs.existsSync(journalPath)) {
            console.error('Migration journal not found at', journalPath);
            console.error('Run `npm run drizzle:generate` first to create migrations');
            process.exit(1);
        }

        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
        const migrations = journal.entries;

        // Apply each migration
        for (const migration of migrations) {
            const migrationPath = path.join(__dirname, '../../drizzle', migration.file);
            const sql = fs.readFileSync(migrationPath, 'utf8');

            console.log(`Applying migration: ${migration.tag} (${migration.file})`);
            await client.query(sql);
        }

        console.log('PGlite database setup complete!');

        // Disconnect
        await client.close();

        return true;
    } catch (error) {
        console.error('Error setting up PGlite database:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    setupPGlite();
}

export default setupPGlite; 