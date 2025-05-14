#!/usr/bin/env node

/**
 * Unified seeding script to run seed commands across all workspaces
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the Docker status
function isDockerRunning() {
    try {
        const result = execSync('docker ps -q', { stdio: 'pipe' }).toString().trim();
        return result.length > 0; // If we get any output, Docker is running
    } catch (error) {
        return false; // If command fails, Docker is likely not running
    }
}

// Define workspaces with seed scripts
const workspaces = [
    {
        name: 'backend',
        path: 'apps/backend',
        seedCommand: 'npm run seed',
    },
    {
        name: 'strapi',
        path: 'apps/strapi',
        // Use docker-seed if Docker is running, otherwise use regular seed
        seedCommand: isDockerRunning() ? 'npm run docker-seed' : 'npm run seed',
    }
];

// Check each workspace if it has seed script
const availableWorkspaces = workspaces.filter(workspace => {
    const packageJsonPath = path.resolve(process.cwd(), workspace.path, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        console.log(`⚠️ No package.json found for ${workspace.name}`);
        return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    if (isDockerRunning() && workspace.name === 'strapi') {
        // For Strapi in Docker, check if docker-seed exists
        return !!packageJson.scripts?.['docker-seed'];
    }

    // For regular seed scripts
    return !!packageJson.scripts?.seed;
});

// Main function
async function seedAll() {
    console.log('🌱 Starting unified seeding across workspaces');

    if (availableWorkspaces.length === 0) {
        console.log('⚠️ No workspaces with seed scripts available');
        process.exit(0);
    }

    const dockerStatus = isDockerRunning() ? '✅ Docker is running' : '⚠️ Docker is not running';
    console.log(dockerStatus);

    let hasError = false;

    for (const workspace of availableWorkspaces) {
        console.log(`\n📦 Seeding ${workspace.name}...`);

        try {
            execSync(workspace.seedCommand, {
                cwd: path.resolve(process.cwd(), workspace.path),
                stdio: 'inherit'
            });
            console.log(`✅ Successfully seeded ${workspace.name}`);
        } catch (error) {
            console.error(`❌ Error seeding ${workspace.name}`);
            hasError = true;
        }
    }

    if (hasError) {
        console.log('\n⚠️ Some seeds failed. Check the logs above for details.');
        process.exit(1);
    } else {
        console.log('\n🎉 All seeds completed successfully!');
    }
}

seedAll().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
}); 