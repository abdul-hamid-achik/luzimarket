import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

const config: Config = {
  schema: "./src/schema.ts",
  out: "./drizzle",
  // SQL dialect for migrations: 'postgresql', 'mysql', or 'sqlite'
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
};

export default config;