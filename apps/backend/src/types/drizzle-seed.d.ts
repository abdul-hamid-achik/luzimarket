// Provide basic type declarations for drizzle-seed

declare module 'drizzle-seed' {
    /** Reset all tables based on provided schema definitions */
    export function reset(db: any, schema: any): Promise<void>;
    /** Seed tables based on schema definitions with optional refine API */
    export function seed(db: any, schema: any, options?: any): {
        refine: (fn: (f: any) => any) => Promise<void>;
    };
} 