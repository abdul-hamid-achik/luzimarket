export default ({ env }) => ({
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    app: {
        keys: env.array('APP_KEYS'),
    },
    webhooks: {
        populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
    // Disable automatic migrations
    migrations: {
        enabled: false,
        batchSize: 1, // Process one record at a time
        safe: true, // Enable safe mode
    },
    // Disable update notifications and startup messages
    logger: {
        updates: {
            enabled: false,
        },
        startup: {
            enabled: false,
        },
    },
}); 