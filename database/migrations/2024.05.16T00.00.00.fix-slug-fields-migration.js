module.exports = {
    async up(knex) {
        // Wrap everything in a transaction
        await knex.transaction(async (trx) => {
            // Get all tables in the current schema
            const tables = await trx
                .select('table_name')
                .from('information_schema.tables')
                .where({ table_schema: 'public' })
                .whereNot('table_name', 'like', 'knex_%');

            // Process each table one at a time
            for (const { table_name } of tables) {
                const hasSlugColumn = await trx.schema.hasColumn(table_name, 'slug');

                if (hasSlugColumn) {
                    // Drop the index if it exists
                    const indexName = `${table_name}_slug_unique`;
                    const hasIndex = await trx.schema.hasTable(table_name).then(async (exists) => {
                        if (!exists) return false;
                        const indices = await trx.raw(`SELECT indexname FROM pg_indexes WHERE tablename = ? AND indexname = ?`, [table_name, indexName]);
                        return indices.rows.length > 0;
                    });

                    if (hasIndex) {
                        await trx.schema.table(table_name, (table) => {
                            table.dropIndex(['slug'], indexName);
                        });
                    }
                }
            }
        });
    },
}; 