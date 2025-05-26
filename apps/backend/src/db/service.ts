import {
    eq,
    and,
    or,
    isNull,
    gt,
    SQL,
    sql
} from 'drizzle-orm';
import { db } from './index';

// Helper function to get the correct database instance
function getDbInstance() {
    console.log('[DB SERVICE DEBUG] getDbInstance() called');
    console.log('[DB SERVICE DEBUG] NODE_ENV:', process.env.NODE_ENV);
    console.log('[DB SERVICE DEBUG] DATABASE_URL:', process.env.DATABASE_URL);

    // Just use the db instance from index.ts - it handles test mode internally
    console.log('[DB SERVICE DEBUG] Using database instance from index.ts');
    return db;
}

// Simple, practical types that work with dynamic schemas
type DatabaseTable = any;
type WhereCondition = SQL<unknown> | undefined;

// Type-safe database service that actually works
class DatabaseService {
    /**
     * Select records from a table
     */
    async select<T = any>(
        table: DatabaseTable,
        where?: WhereCondition
    ): Promise<T[]> {
        try {
            console.log('[DB SERVICE] select() called');
            console.log('[DB SERVICE] NODE_ENV:', process.env.NODE_ENV);
            console.log('[DB SERVICE] DATABASE_URL:', process.env.DATABASE_URL);

            const database = getDbInstance();
            console.log('[DB SERVICE] Database instance obtained:', typeof database);

            const query = (database as any).select().from(table);

            if (where) {
                return await query.where(where);
            }
            return await query;
        } catch (error) {
            console.error('Database select error:', error);
            throw new Error(`Failed to select from table: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Select specific fields from a table
     */
    async selectFields<T = any>(
        fields: Record<string, any>,
        table: DatabaseTable,
        where?: WhereCondition
    ): Promise<T[]> {
        try {
            const database = getDbInstance();
            const query = (database as any).select(fields).from(table);

            if (where) {
                return await query.where(where);
            }
            return await query;
        } catch (error) {
            console.error('Database selectFields error:', error);
            throw new Error(`Failed to select fields from table: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Insert records into a table
     */
    async insert<T = any>(
        table: DatabaseTable,
        values: T | T[]
    ): Promise<void> {
        try {
            const database = getDbInstance();
            await (database as any).insert(table).values(values);
        } catch (error) {
            console.error('Database insert error:', error);
            throw new Error(`Failed to insert into table: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Insert records and return the inserted data
     * Returns any[] by default to work with TypeScript strict mode
     */
    async insertReturning(
        table: DatabaseTable,
        values: any | any[],
        returning?: Record<string, any>
    ): Promise<any[]> {
        try {
            const database = getDbInstance();
            const query = (database as any).insert(table).values(values);

            if (returning) {
                return await query.returning(returning);
            }
            return await query.returning();
        } catch (error) {
            console.error('Database insertReturning error:', error);
            throw new Error(`Failed to insert and return from table: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update records in a table
     */
    async update<T = any>(
        table: DatabaseTable,
        values: Partial<T>,
        where?: WhereCondition
    ): Promise<void> {
        try {
            const database = getDbInstance();
            const query = (database as any).update(table).set(values);

            if (where) {
                await query.where(where);
            } else {
                await query;
            }
        } catch (error) {
            console.error('Database update error:', error);
            throw new Error(`Failed to update table: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update records and return the updated data
     * Returns any[] by default to work with TypeScript strict mode
     */
    async updateReturning(
        table: DatabaseTable,
        values: any,
        where?: WhereCondition,
        returning?: Record<string, any>
    ): Promise<any[]> {
        try {
            const database = getDbInstance();
            const query = (database as any).update(table).set(values);
            const updateQuery = where ? query.where(where) : query;

            if (returning) {
                return await updateQuery.returning(returning);
            }
            return await updateQuery.returning();
        } catch (error) {
            console.error('Database updateReturning error:', error);
            throw new Error(`Failed to update and return from table: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete records from a table
     */
    async delete(
        table: DatabaseTable,
        where?: WhereCondition
    ): Promise<void> {
        try {
            const database = getDbInstance();
            const query = (database as any).delete(table);

            if (where) {
                await query.where(where);
            } else {
                await query;
            }
        } catch (error) {
            console.error('Database delete error:', error);
            throw new Error(`Failed to delete from table: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete records and return the deleted data
     * Returns any[] by default to work with TypeScript strict mode
     */
    async deleteReturning(
        table: DatabaseTable,
        where?: WhereCondition,
        returning?: Record<string, any>
    ): Promise<any[]> {
        try {
            const database = getDbInstance();
            const query = (database as any).delete(table);
            const deleteQuery = where ? query.where(where) : query;

            if (returning) {
                return await deleteQuery.returning(returning);
            }
            return await deleteQuery.returning();
        } catch (error) {
            console.error('Database deleteReturning error:', error);
            throw new Error(`Failed to delete and return from table: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Execute raw SQL queries
     */
    async execute<T = any>(sql: SQL<T>): Promise<T[]> {
        try {
            const database = getDbInstance();
            // For PostgreSQL/Neon
            if ('execute' in database && typeof database.execute === 'function') {
                return await (database as any).execute(sql);
            }

            // For SQLite - try all() first for SELECT queries
            return await (database as any).all(sql);
        } catch (error) {
            // Fallback to run() for non-SELECT queries
            try {
                const database = getDbInstance();
                const result = await (database as any).run(sql);
                return [result] as T[];
            } catch (runError) {
                console.error('Database execute error:', error, runError);
                throw new Error(`Database execute failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    /**
     * Find the first record matching the criteria
     */
    async findFirst<T = any>(
        table: DatabaseTable,
        where?: WhereCondition
    ): Promise<T | null> {
        try {
            const results = await this.select<T>(table, where);
            return results[0] || null;
        } catch (error) {
            console.error('Database findFirst error:', error);
            throw new Error(`Failed to find first record: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Find a unique record - throws if more than one found
     */
    async findUnique<T = any>(
        table: DatabaseTable,
        where: WhereCondition
    ): Promise<T | null> {
        try {
            const results = await this.select<T>(table, where);

            if (results.length > 1) {
                throw new Error('Found multiple records when expecting unique result');
            }

            return results[0] || null;
        } catch (error) {
            console.error('Database findUnique error:', error);
            throw new Error(`Failed to find unique record: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Count records in a table
     */
    async count(
        table: DatabaseTable,
        where?: WhereCondition
    ): Promise<number> {
        try {
            const database = getDbInstance();
            const query = (database as any).select({ count: sql`count(*)` }).from(table);

            const result = where
                ? await query.where(where)
                : await query;

            return Number(result[0]?.count) || 0;
        } catch (error) {
            console.error('Database count error:', error);
            throw new Error(`Failed to count records: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if any records exist matching the criteria
     */
    async exists(
        table: DatabaseTable,
        where: WhereCondition
    ): Promise<boolean> {
        try {
            const count = await this.count(table, where);
            return count > 0;
        } catch (error) {
            console.error('Database exists error:', error);
            throw new Error(`Failed to check existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Transaction wrapper for multiple operations
     */
    async transaction<T>(callback: (_tx: any) => Promise<T>): Promise<T> {
        try {
            const database = getDbInstance();
            return await (database as any).transaction(callback);
        } catch (error) {
            console.error('Database transaction error:', error);
            throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get the current schema tables (dynamic based on environment)
     */
    async getSchema() {
        const { getSchema } = await import('./schema');
        return await getSchema();
    }

    /**
     * Direct access to the database instance for complex queries
     */
    get raw() {
        return getDbInstance();
    }

    /**
     * Backwards compatibility alias
     */
    get db() {
        return getDbInstance();
    }
}

// Export the service instance
export const dbService = new DatabaseService();

// Export commonly used Drizzle operators and helpful types
export { eq, and, or, isNull, gt, SQL, sql };
export type { WhereCondition, DatabaseTable }; 