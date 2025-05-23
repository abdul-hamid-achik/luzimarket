import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Users table for authentication
export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name'),
    stripe_customer_id: text('stripe_customer_id'),
    role: text('role').default('user').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;

export const empleados = sqliteTable('empleados', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    nombre: text('nombre').notNull(),
    puesto: text('puesto').notNull(),
    email: text('email').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(), // Managed by application logic
});

export type EmpleadoInsert = typeof empleados.$inferInsert;
export type EmpleadoSelect = typeof empleados.$inferSelect;

export const categories = sqliteTable('categories', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
});

export const products = sqliteTable('products', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    price: integer('price').notNull(),
    categoryId: text('category_id').references(() => categories.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const productVariants = sqliteTable('product_variants', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    productId: text('product_id').references(() => products.id),
    sku: text('sku').notNull().unique(),
    attributes: text('attributes').notNull(), // Store JSON as TEXT
    stock: integer('stock').notNull().default(0),
});

export const photos = sqliteTable('photos', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    url: text('url').notNull(),
    alt: text('alt_text'),
    sortOrder: integer('sort_order').default(0).notNull(),
    productId: text('product_id').references(() => products.id),
});

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    userId: text('user_id').references(() => users.id),
    isGuest: integer('is_guest', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const cartItems = sqliteTable('cart_items', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    sessionId: text('session_id').references(() => sessions.id),
    variantId: text('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull().default(1),
});

export const states = sqliteTable('states', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    label: text('label').notNull(),
    value: text('value').notNull().unique(),
});

export const deliveryZones = sqliteTable('delivery_zones', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    name: text('name').notNull(),
    fee: integer('fee').notNull().default(0),
});

export const orders = sqliteTable('orders', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    userId: text('user_id').references(() => users.id),
    total: integer('total').notNull(),
    status: text('status').notNull().default('pending'),
    payment_status: text('payment_status').default('pending'), // pending, processing, succeeded, failed, canceled
    payment_intent_id: text('payment_intent_id'), // Stripe Payment Intent ID
    stripe_customer_id: text('stripe_customer_id'), // Stripe Customer ID
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const orderItems = sqliteTable('order_items', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    orderId: text('order_id').references(() => orders.id),
    variantId: text('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull(),
    price: integer('price_at_purchase').notNull(),
});

export const brands = sqliteTable('brands', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    website: text('website').notNull(),
});

export const occasions = sqliteTable('occasions', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    name: text('name').notNull(),
    description: text('description').notNull(),
    slug: text('slug').notNull().unique(),
});

export const editorialArticles = sqliteTable('editorial_articles', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    title: text('title').notNull(),
    content: text('content').notNull(),
    author: text('author').notNull(),
    slug: text('slug').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const favorites = sqliteTable('favorites', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    userId: text('user_id').references(() => users.id),
    variantId: text('variant_id').references(() => productVariants.id),
});

export const petitions = sqliteTable('petitions', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    type: text('type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const bundles = sqliteTable('bundles', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const bundleItems = sqliteTable('bundle_items', {
    id: text('id').primaryKey().$defaultFn(() => uuidv4()),
    bundleId: text('bundle_id').references(() => bundles.id),
    variantId: text('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull().default(1),
});

export type BundleInsert = typeof bundles.$inferInsert;
export type BundleSelect = typeof bundles.$inferSelect;
export type BundleItemInsert = typeof bundleItems.$inferInsert;
export type BundleItemSelect = typeof bundleItems.$inferSelect;

export type StateInsert = typeof states.$inferInsert;
export type StateSelect = typeof states.$inferSelect;

export type DeliveryZoneInsert = typeof deliveryZones.$inferInsert;
export type DeliveryZoneSelect = typeof deliveryZones.$inferSelect;

// Lookup tables for various static values
export const sizes = sqliteTable('sizes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    size: text('size').notNull().unique(),
});

export const imageCategories = sqliteTable('image_categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
});

export const productTypes = sqliteTable('product_types', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
});

export const materials = sqliteTable('materials', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
});

export const articleTopics = sqliteTable('article_topics', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
}); 