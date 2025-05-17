#!/usr/bin/env node

/**
 * Unified migration script to run migrations across backend and strapi workspaces.
 * Inspired by scripts/seed-all.js structure.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runBackendMigrations() {
    const backendPath = path.resolve(process.cwd(), 'apps/backend');
    const packageJsonPath = path.join(backendPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        console.log('⚠️ No package.json found for backend');
        return false;
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    // Prefer migrate:up, fallback to migrate:push
    let migrateScript = null;
    if (packageJson.scripts?.['migrate:up']) {
        migrateScript = 'npm run migrate:up';
    } else if (packageJson.scripts?.['migrate:push']) {
        migrateScript = 'npm run migrate:push';
    } else {
        console.log('⚠️ No migration script found for backend');
        return false;
    }
    try {
        console.log('📦 Running backend migrations...');
        execSync(migrateScript, {
            cwd: backendPath,
            stdio: 'inherit'
        });
        console.log('✅ Backend migrations completed successfully');
        return true;
    } catch (error) {
        console.error('❌ Error running backend migrations');
        return false;
    }
}

async function runStrapiMigrations() {
    const strapiPath = path.resolve(process.cwd(), 'apps/strapi');
    const packageJsonPath = path.join(strapiPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        console.log('⚠️ No package.json found for strapi');
        return false;
    }
    try {
        console.log('📦 Running Strapi migrations...');
        // Execute migrations through the workspace using the strapi script
        execSync('npm run strapi -- database:migrate', {
            cwd: strapiPath,
            stdio: 'inherit'
        });
        console.log('✅ Strapi migrations completed successfully');
        return true;
    } catch (error) {
        console.error('❌ Error running Strapi migrations:', error);
        return false;
    }
}

async function migrateAll() {
    console.log('🚀 Starting unified migrations across workspaces');

    let hasError = false;

    // Backend
    const backendOk = await runBackendMigrations();
    if (!backendOk) hasError = true;

    // Strapi
    const strapiOk = await runStrapiMigrations();
    if (!strapiOk) hasError = true;

    if (hasError) {
        console.log('\n⚠️ Some migrations failed. Check the logs above for details.');
        process.exit(1);
    } else {
        console.log('\n🎉 All migrations completed successfully!');
        process.exit(0);
    }
}

migrateAll().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});