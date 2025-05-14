-- Migration to drop unused tables after moving to Strapi
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS admin_orders CASCADE;
DROP TABLE IF EXISTS states CASCADE;
