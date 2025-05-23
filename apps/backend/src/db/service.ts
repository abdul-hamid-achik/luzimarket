import { eq, and, or, isNull, SQL } from 'drizzle-orm';
import { db } from './index';
import * as schema from './schema';

// Type-safe database service that handles the union type issue
class DatabaseService {
    // Generic select method that handles the union type
    async select<T extends keyof typeof schema>(
        table: typeof schema[T],
        where?: SQL<unknown> | undefined
    ) {
        if (where) {
            // Cast to any to handle union type, but maintain type safety at the API level
            return await (db as any).select().from(table).where(where);
        }
        return await (db as any).select().from(table);
    }

    // Specific select with custom fields
    async selectFields<T extends keyof typeof schema>(
        fields: Record<string, any>,
        table: typeof schema[T],
        where?: SQL<unknown> | undefined
    ) {
        if (where) {
            return await (db as any).select(fields).from(table).where(where);
        }
        return await (db as any).select(fields).from(table);
    }

    // Insert method
    async insert<T extends keyof typeof schema>(
        table: typeof schema[T],
        values: any
    ) {
        return await (db as any).insert(table).values(values);
    }

    // Insert with returning
    async insertReturning<T extends keyof typeof schema>(
        table: typeof schema[T],
        values: any,
        returning?: Record<string, any>
    ) {
        if (returning) {
            return await (db as any).insert(table).values(values).returning(returning);
        }
        return await (db as any).insert(table).values(values).returning();
    }

    // Update method
    async update<T extends keyof typeof schema>(
        table: typeof schema[T],
        values: any,
        where: SQL<unknown> | undefined
    ) {
        if (where) {
            return await (db as any).update(table).set(values).where(where);
        }
        return await (db as any).update(table).set(values);
    }

    // Delete method
    async delete<T extends keyof typeof schema>(
        table: typeof schema[T],
        where: SQL<unknown> | undefined
    ) {
        if (where) {
            return await (db as any).delete(table).where(where);
        }
        return await (db as any).delete(table);
    }

    // Execute raw SQL
    async execute(sql: SQL<unknown>) {
        return await (db as any).execute(sql);
    }

    // Convenient method to get a single record
    async findFirst<T extends keyof typeof schema>(
        table: typeof schema[T],
        where: SQL<unknown> | undefined
    ) {
        const results = await this.select(table, where);
        return results[0] || null;
    }

    // Raw database access for complex queries
    get raw() {
        return db as any;
    }
}

export const dbService = new DatabaseService();
export { eq, and, or, isNull }; 