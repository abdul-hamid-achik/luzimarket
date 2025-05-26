-- Migration to add Stripe-related fields to orders table
-- This script works for both PostgreSQL and SQLite

-- Add new columns to orders table
ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN stripe_customer_id TEXT;

-- For PostgreSQL, add updated_at column with automatic updates
-- For SQLite, add updated_at column (manual updates required)
ALTER TABLE orders ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index on payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_customer_id ON orders(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status); 