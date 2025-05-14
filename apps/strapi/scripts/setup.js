'use strict';

/**
 * Complete setup script for Strapi v5.
 * Run with: `node ./scripts/setup.js` from apps/strapi
 * This will initialize the database and then seed it.
 */
const { execSync } = require('child_process');
const path = require('path');

async function main() {
    const scriptDir = path.dirname(__filename);
    const projectDir = path.resolve(scriptDir, '..');

    console.log('🔄 Starting Strapi setup process...');

    try {
        console.log('\n📊 Initializing database tables...');
        execSync('node ./scripts/init-db.js', {
            cwd: projectDir,
            stdio: 'inherit'
        });

        console.log('\n🌱 Seeding database with initial data...');
        execSync('node ./scripts/seed.js', {
            cwd: projectDir,
            stdio: 'inherit'
        });

        console.log('\n✅ Setup completed successfully!');
    } catch (error) {
        console.error('\n❌ Setup failed!');
        process.exit(1);
    }
}

main(); 