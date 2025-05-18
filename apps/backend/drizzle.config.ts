import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

const config: Config = {
  // Include main schema for migrations
  schema: [
    "./src/schema.ts",
  ],
  out: "./drizzle",
  // SQL dialect for migrations: 'postgresql', 'mysql', or 'sqlite'
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "../../tmp/ecommerce.db",
  },
};

export default config;