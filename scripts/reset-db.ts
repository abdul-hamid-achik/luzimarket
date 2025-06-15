import { config } from "dotenv";
import { sql } from "drizzle-orm";

// Load environment variables before importing db
config({ path: ".env.local" });

import { db } from "../db/index";

async function resetDatabase() {
  console.log("🗑️  Dropping all tables...");
  
  try {
    // Drop all tables in reverse order of dependencies
    await db.execute(sql`DROP TABLE IF EXISTS reviews CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS order_items CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS orders CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS products CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS vendors CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS categories CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS admin_users CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS email_templates CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS subscriptions CASCADE`);
    
    console.log("✅ All tables dropped successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error dropping tables:", error);
    process.exit(1);
  }
}

resetDatabase();