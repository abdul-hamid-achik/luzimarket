const Strapi = require('@strapi/strapi');

async function runMigrations() {
    try {
        console.log('Starting Strapi in migrate mode...');
        const strapi = await Strapi().load();

        console.log('Running migrations...');
        await strapi.db.migrations.up({
            batchSize: 1, // Process one record at a time
            safe: true // Enable safe mode
        });

        console.log('Migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error during migration:', error);
        process.exit(1);
    }
}

runMigrations(); 