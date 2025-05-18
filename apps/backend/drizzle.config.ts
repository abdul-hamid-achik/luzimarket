import type { Config } from "drizzle-kit";
import dotenv from "dotenv";
dotenv.config();

const config: Config = {
  // Include main schema for migrations
  schema: ["./src/schema.ts"],
  out: "./drizzle",
  dialect:
    process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN
      ? "turso"
      : "sqlite",
  dbCredentials:
    process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN
      ? {
          url: process.env.TURSO_CONNECTION_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        }
      : {
          url: process.env.DATABASE_URL || "../../tmp/ecommerce.db",
        },
};

export default config;