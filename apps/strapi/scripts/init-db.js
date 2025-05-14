'use strict';

/**
 * Database initialization script for Strapi v5.
 * Run with: `node ./scripts/init-db.js` from apps/strapi
 * This will ensure the database structure exists before seeding.
 */
const path = require('path');
// Load local environment variables for local initialization
if (!process.env.DATABASE_HOST) {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
}
// Ensure transfer token salt
if (!process.env.TRANSFER_TOKEN_SALT) {
    process.env.TRANSFER_TOKEN_SALT = require('crypto').randomBytes(16).toString('base64');
    console.log('ℹ️  Generated TRANSFER_TOKEN_SALT for initialization');
}
// Ensure module resolution includes the local Strapi installation
process.env.NODE_PATH = path.resolve(__dirname, '..', 'node_modules');
require('module').Module._initPaths();
const { createStrapi } = require('@strapi/strapi');

async function initializeDb() {
    const projectDir = path.resolve(__dirname, '..');
    process.chdir(projectDir);
    const app = createStrapi({
        appDir: projectDir,
        distDir: path.resolve(projectDir, 'dist'),
        autoReload: false,
    });

    try {
        console.log('🚀 Initializing Strapi...');

        // This loads and starts Strapi, which will initialize the database
        await app.load();
        await app.start();
        console.log('✅ Strapi started and database initialized');

        // Optional: Check the user table structure
        try {
            const tables = await app.db.connection.raw('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';');
            console.log('Available tables:', tables.rows.map(t => t.table_name).join(', '));

            // Try to find user-related tables
            const userTables = tables.rows.filter(t => t.table_name.includes('user'));
            if (userTables.length > 0) {
                console.log('User-related tables:', userTables.map(t => t.table_name).join(', '));

                // Display columns for each user table
                for (const table of userTables) {
                    const columns = await app.db.connection.raw(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table.table_name}';`);
                    console.log(`${table.table_name} columns:`, columns.rows.map(c => c.column_name).join(', '));
                }
            } else {
                console.log('No user-related tables found.');
            }
        } catch (e) {
            console.error('Error inspecting database structure:', e);
        }
    } catch (err) {
        console.error('❌ Initialization failed:', err);
        throw err;
    } finally {
        // Always clean up
        console.log('🛑 Stopping Strapi...');
        await app.destroy();
        console.log('✅ Strapi stopped');
    }
}

initializeDb()
    .catch((err) => {
        console.error('❌ Database initialization failed:', err);
        process.exit(1);
    })
    .then(() => {
        console.log('✅ Database initialization completed');
        process.exit(0);
    }); 