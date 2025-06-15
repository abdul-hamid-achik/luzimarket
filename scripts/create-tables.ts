import { config } from "dotenv";
import { sql } from "drizzle-orm";

// Load environment variables before importing db
config({ path: ".env.local" });

import { db } from "../db/index";

async function createTables() {
  console.log("📦 Creating tables...");
  
  try {
    // Create vendors table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        contact_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        whatsapp TEXT,
        business_phone TEXT,
        business_hours TEXT,
        street TEXT,
        city TEXT,
        state TEXT,
        country TEXT DEFAULT 'México',
        postal_code TEXT,
        website_url TEXT,
        description TEXT,
        has_delivery BOOLEAN DEFAULT false,
        delivery_service TEXT,
        instagram_url TEXT,
        facebook_url TEXT,
        tiktok_url TEXT,
        twitter_url TEXT,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create products table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        images JSONB,
        is_active BOOLEAN DEFAULT true,
        stock INTEGER DEFAULT 0,
        sku TEXT,
        tags JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT,
        stripe_customer_id TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create admin_users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create orders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number TEXT NOT NULL UNIQUE,
        user_id UUID REFERENCES users(id),
        vendor_id UUID NOT NULL REFERENCES vendors(id),
        status TEXT NOT NULL DEFAULT 'pending',
        subtotal DECIMAL(10, 2) NOT NULL,
        tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
        shipping DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'MXN',
        payment_intent_id TEXT,
        payment_status TEXT DEFAULT 'pending',
        shipping_address JSONB,
        billing_address JSONB,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create order_items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create reviews table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        order_id UUID REFERENCES orders(id),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title TEXT,
        comment TEXT,
        is_verified_purchase BOOLEAN DEFAULT false,
        helpful_count INTEGER DEFAULT 0,
        images JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create email_templates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        subject TEXT NOT NULL,
        html_template TEXT NOT NULL,
        text_template TEXT,
        variables JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create subscriptions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS vendors_email_idx ON vendors(email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS vendors_business_name_idx ON vendors(business_name)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS vendors_slug_idx ON vendors(slug)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories(slug)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS products_vendor_idx ON products(vendor_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS products_slug_idx ON products(slug)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users(email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS orders_vendor_idx ON orders(vendor_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status)`);

    console.log("✅ All tables created successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating tables:", error);
    process.exit(1);
  }
}

createTables();