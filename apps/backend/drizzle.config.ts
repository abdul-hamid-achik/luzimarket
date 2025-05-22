import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';

dotenv.config();

// Get database mode from environment variable - defaults to "neon"
const DB_MODE = process.env.DB_MODE || 'neon';
const DATABASE_URL = process.env.DATABASE_URL!;

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    // Both Neon and PGlite are PostgreSQL-compatible
    dialect: "postgresql",
    dbCredentials: {
        url: DATABASE_URL,
    },
}); 