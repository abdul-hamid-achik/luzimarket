import { pgTable, text, timestamp, serial, integer, json, boolean, varchar, uuid } from 'drizzle-orm/pg-core';

// Users table for authentication
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name'),
    role: text('role').default('user').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;

export const empleados = pgTable('empleados', {
    id: serial('id').primaryKey(),
    nombre: text('nombre').notNull(),
    puesto: text('puesto').notNull(),
    email: text('email').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

export type EmpleadoInsert = typeof empleados.$inferInsert;
export type EmpleadoSelect = typeof empleados.$inferSelect;

// Categories for products and CMS occasions
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
});

// Products and variants
export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    price: integer('price').notNull(),
    categoryId: integer('category_id').references(() => categories.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const productVariants = pgTable('product_variants', {
    id: serial('id').primaryKey(),
    productId: integer('product_id').references(() => products.id),
    sku: text('sku').notNull().unique(),
    attributes: json('attributes').notNull(),
    stock: integer('stock').notNull().default(0),
});

export const photos = pgTable('photos', {
    id: serial('id').primaryKey(),
    url: text('url').notNull(),
    alt: text('alt_text'),
    sortOrder: integer('sort_order').default(0).notNull(),
    productId: integer('product_id').references(() => products.id),
});

// Guest & user sessions for cart
export const sessions = pgTable('sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    isGuest: boolean('is_guest').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const cartItems = pgTable('cart_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id').references(() => sessions.id),
    variantId: integer('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull().default(1),
});

export const states = pgTable('states', {
    id: serial('id').primaryKey(),
    label: text('label').notNull(),
    value: text('value').notNull().unique(),
});

export const deliveryZones = pgTable('delivery_zones', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    fee: integer('fee').notNull().default(0),
});

// Orders & order items
export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    total: integer('total').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').references(() => orders.id),
    variantId: integer('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull(),
    price: integer('price_at_purchase').notNull(),
});

// Brands, occasions, editorial, favorites, petitions for CMS
export const brands = pgTable('brands', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    website: text('website').notNull(),
});
export const occasions = pgTable('occasions', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    slug: text('slug').notNull().unique(),
});
export const editorialArticles = pgTable('editorial_articles', {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    author: text('author').notNull(),
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const favorites = pgTable('favorites', {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    variantId: integer('variant_id').references(() => productVariants.id),
});
export const petitions = pgTable('petitions', {
    id: serial('id').primaryKey(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Bundles for grouping products
export const bundles = pgTable('bundles', {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bundleItems = pgTable('bundle_items', {
    id: serial('id').primaryKey(),
    bundleId: integer('bundle_id').references(() => bundles.id),
    variantId: integer('variant_id').references(() => productVariants.id),
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
export const sizes = pgTable('sizes', {
    id: serial('id').primaryKey(),
    size: text('size').notNull().unique(),
});

export const imageCategories = pgTable('image_categories', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
});

export const productTypes = pgTable('product_types', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
});

export const materials = pgTable('materials', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
});

export const articleTopics = pgTable('article_topics', {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
});
