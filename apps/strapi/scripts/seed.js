'use strict';

/**
 * A basic seed script for Strapi v5.
 * Run with: `npm run seed` from apps/strapi
 */
const path = require('path');
// Load local environment variables when DATABASE_HOST isn't already defined (for local seeding)
if (!process.env.DATABASE_HOST) {
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
}
// Auto-generate a transfer token salt if not provided, to enable data transfer features during seeding
if (!process.env.TRANSFER_TOKEN_SALT) {
    process.env.TRANSFER_TOKEN_SALT = require('crypto').randomBytes(16).toString('base64');
    console.log('ℹ️  Generated TRANSFER_TOKEN_SALT for seeding');
}
// Ensure module resolution includes the local Strapi installation
process.env.NODE_PATH = path.resolve(__dirname, '..', 'node_modules');
require('module').Module._initPaths();
const { createStrapi } = require('@strapi/strapi');

async function seed() {
    const projectDir = path.resolve(__dirname, '..');
    // switch cwd to the Strapi project root so module resolution finds @strapi/strapi
    process.chdir(projectDir);
    const app = createStrapi({
        appDir: projectDir,
        distDir: path.resolve(projectDir, 'dist'),
        autoReload: false,
    });

    // Load Strapi without starting the HTTP server
    await app.load();

    // Access entityService or use query API to seed your data
    // Example: create a default role (replace with your own content-type)
    // await app.entityService.create('plugin::users-permissions.role', {
    //   data: { name: 'Editor', description: 'Can edit content' },
    // });

    console.log('✅ Seeding completed successfully');
    await app.destroy();
}

seed()
    .catch((err) => {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    })
    .then(() => process.exit(0)); 