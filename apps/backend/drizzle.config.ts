import { defineConfig } from "drizzle-kit";
// @ts-ignore: Allow importing dotenv without type declarations
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
}); 