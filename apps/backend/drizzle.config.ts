import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

const config: Config = {
  // Include main schema and Tina-specific schema for migrations
  schema: [
    "./src/schema.ts",
    "./src/tina/schema.ts",
  ],
  out: "./drizzle",
  // SQL dialect for migrations: 'postgresql', 'mysql', or 'sqlite'
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
};

export default config;