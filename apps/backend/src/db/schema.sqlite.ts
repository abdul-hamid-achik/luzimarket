import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { generatePrefixedId, ID_PATTERNS } from '../lib/ids';

// Users table for authentication
export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.USER)),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name'),
    stripe_customer_id: text('stripe_customer_id'),
    role: text('role', { enum: ['customer', 'employee', 'admin', 'vendor'] }).default('customer').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    preferredDeliveryZoneId: text('preferred_delivery_zone_id').references(() => deliveryZones.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;

export const empleados = sqliteTable('empleados', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.EMPLOYEE)),
    nombre: text('nombre').notNull(),
    puesto: text('puesto').notNull(),
    email: text('email').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type EmpleadoInsert = typeof empleados.$inferInsert;
export type EmpleadoSelect = typeof empleados.$inferSelect;

export const categories = sqliteTable('categories', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.CATEGORY)),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
});

export const products = sqliteTable('products', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.PRODUCT)),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    price: integer('price').notNull(),
    categoryId: text('category_id').references(() => categories.id),
    vendorId: text('vendor_id').references(() => vendors.id),
    status: text('status', { enum: ['draft', 'active', 'inactive', 'out_of_stock'] }).default('draft').notNull(),
    featured: integer('featured', { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const productVariants = sqliteTable('product_variants', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.VARIANT)),
    productId: text('product_id').references(() => products.id),
    sku: text('sku').notNull().unique(),
    attributes: text('attributes').notNull(), // Store JSON as TEXT
    stock: integer('stock').notNull().default(0),
});

export const photos = sqliteTable('photos', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.PHOTO)),
    url: text('url').notNull(),
    alt: text('alt_text'),
    sortOrder: integer('sort_order').default(0).notNull(),
    productId: text('product_id').references(() => products.id),
});

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.SESSION)),
    userId: text('user_id').references(() => users.id),
    isGuest: integer('is_guest', { mode: 'boolean' }).notNull().default(true),
    deliveryZoneId: text('delivery_zone_id').references(() => deliveryZones.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const cartItems = sqliteTable('cart_items', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.CART)),
    sessionId: text('session_id').references(() => sessions.id),
    variantId: text('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull().default(1),
});

export const states = sqliteTable('states', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.STATE)),
    label: text('label').notNull(),
    value: text('value').notNull().unique(),
});

export const deliveryZones = sqliteTable('delivery_zones', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.DELIVERY)),
    name: text('name').notNull(),
    fee: integer('fee').notNull().default(0),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    description: text('description'),
});

export const orders = sqliteTable('orders', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.ORDER)),
    userId: text('user_id').references(() => users.id),
    total: integer('total').notNull(),
    status: text('status').notNull().default('pending'),
    payment_status: text('payment_status').default('pending'), // pending, processing, succeeded, failed, canceled
    payment_intent_id: text('payment_intent_id'), // Stripe Payment Intent ID
    stripe_customer_id: text('stripe_customer_id'), // Stripe Customer ID
    // Shipping and tracking fields
    tracking_number: text('tracking_number'),
    tracking_url: text('tracking_url'),
    shipping_carrier: text('shipping_carrier'), // fedex, ups, dhl, correos_mexico, estafeta, etc.
    shipping_service: text('shipping_service'), // express, standard, overnight, etc.
    shipped_at: integer('shipped_at', { mode: 'timestamp' }),
    estimated_delivery: integer('estimated_delivery', { mode: 'timestamp' }),
    delivered_at: integer('delivered_at', { mode: 'timestamp' }),
    delivery_notes: text('delivery_notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const orderItems = sqliteTable('order_items', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.CART)),
    orderId: text('order_id').references(() => orders.id),
    variantId: text('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull(),
    price: integer('price_at_purchase').notNull(),
});

export const brands = sqliteTable('brands', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.BRAND)),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    website: text('website').notNull(),
});

export const occasions = sqliteTable('occasions', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.OCCASION)),
    name: text('name').notNull(),
    description: text('description').notNull(),
    slug: text('slug').notNull().unique(),
});

export const editorialArticles = sqliteTable('editorial_articles', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.ARTICLE)),
    title: text('title').notNull(),
    content: text('content').notNull(),
    author: text('author').notNull(),
    slug: text('slug').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const favorites = sqliteTable('favorites', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.CART)),
    userId: text('user_id').references(() => users.id),
    variantId: text('variant_id').references(() => productVariants.id),
});

export const petitions = sqliteTable('petitions', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.PETITION)),
    type: text('type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const bundles = sqliteTable('bundles', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.BUNDLE)),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const bundleItems = sqliteTable('bundle_items', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.CART)),
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

// Add vendors table after empleados
export const vendors = sqliteTable('vendors', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.VENDOR)),
    userId: text('user_id').references(() => users.id).notNull(),
    businessName: text('business_name').notNull(),
    contactPerson: text('contact_person').notNull(),
    phone: text('phone').notNull(),
    address: text('address').notNull(),
    taxId: text('tax_id'),
    commissionRate: integer('commission_rate').default(10).notNull(), // percentage
    status: text('status', { enum: ['pending', 'approved', 'suspended', 'rejected'] }).default('pending').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type VendorInsert = typeof vendors.$inferInsert;
export type VendorSelect = typeof vendors.$inferSelect;

// Refresh tokens table for JWT token refresh functionality
export const refreshTokens = sqliteTable('refresh_tokens', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.TOKEN)),
    userId: text('user_id').references(() => users.id).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    isRevoked: integer('is_revoked', { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type RefreshTokenInsert = typeof refreshTokens.$inferInsert;
export type RefreshTokenSelect = typeof refreshTokens.$inferSelect;

// Homepage banners/slides for CMS management
export const homepageSlides = sqliteTable('homepage_slides', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.SLIDE)),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    description: text('description'),
    imageUrl: text('image_url').notNull(),
    buttonText: text('button_text'),
    buttonLink: text('button_link'),
    backgroundColor: text('background_color').default('#ffffff'),
    textColor: text('text_color').default('#000000'),
    position: text('position', { enum: ['center', 'left', 'right'] }).default('center').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type HomepageSlideInsert = typeof homepageSlides.$inferInsert;
export type HomepageSlideSelect = typeof homepageSlides.$inferSelect;

// Product Reviews & Ratings
export const productReviews = sqliteTable('product_reviews', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.REVIEW)),
    productId: text('product_id').references(() => products.id).notNull(),
    userId: text('user_id').references(() => users.id).notNull(),
    rating: integer('rating').notNull(), // 1-5 stars
    title: text('title').notNull(),
    comment: text('comment').notNull(),
    isVerifiedPurchase: integer('is_verified_purchase', { mode: 'boolean' }).default(false).notNull(),
    isApproved: integer('is_approved', { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type ProductReviewInsert = typeof productReviews.$inferInsert;
export type ProductReviewSelect = typeof productReviews.$inferSelect;

// User Shipping Addresses
export const userAddresses = sqliteTable('user_addresses', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.ADDRESS)),
    userId: text('user_id').references(() => users.id).notNull(),
    type: text('type', { enum: ['shipping', 'billing'] }).default('shipping').notNull(),
    isDefault: integer('is_default', { mode: 'boolean' }).default(false).notNull(),
    fullName: text('full_name').notNull(),
    street: text('street').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    postalCode: text('postal_code').notNull(),
    country: text('country').default('México').notNull(),
    phone: text('phone'),
    instructions: text('delivery_instructions'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type UserAddressInsert = typeof userAddresses.$inferInsert;
export type UserAddressSelect = typeof userAddresses.$inferSelect;

// Discount Codes & Coupons
export const discountCodes = sqliteTable('discount_codes', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.DISCOUNT)),
    code: text('code').notNull().unique(),
    type: text('type', { enum: ['percentage', 'fixed_amount', 'free_shipping'] }).notNull(),
    value: integer('value').notNull(), // percentage (1-100) or amount in centavos
    minOrderAmount: integer('min_order_amount').default(0).notNull(),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').default(0).notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type DiscountCodeInsert = typeof discountCodes.$inferInsert;
export type DiscountCodeSelect = typeof discountCodes.$inferSelect;

// Order Addresses (snapshot of shipping info at order time)
export const orderAddresses = sqliteTable('order_addresses', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.ADDRESS)),
    orderId: text('order_id').references(() => orders.id).notNull(),
    type: text('type', { enum: ['shipping', 'billing'] }).notNull(),
    fullName: text('full_name').notNull(),
    street: text('street').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    postalCode: text('postal_code').notNull(),
    country: text('country').notNull(),
    phone: text('phone'),
    instructions: text('delivery_instructions'),
});

export type OrderAddressInsert = typeof orderAddresses.$inferInsert;
export type OrderAddressSelect = typeof orderAddresses.$inferSelect;

// Tracking History for detailed tracking updates
export const trackingHistory = sqliteTable('tracking_history', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.TRACKING)),
    orderId: text('order_id').references(() => orders.id).notNull(),
    status: text('status').notNull(), // in_transit, out_for_delivery, delivered, exception, etc.
    description: text('description').notNull(),
    location: text('location'), // Ciudad, Estado, País
    timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
    carrier_status: text('carrier_status'), // Raw status from carrier
    created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type TrackingHistoryInsert = typeof trackingHistory.$inferInsert;
export type TrackingHistorySelect = typeof trackingHistory.$inferSelect;

// Many-to-many relationship between products and delivery zones
export const productDeliveryZones = sqliteTable('product_delivery_zones', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.DELIVERY)),
    productId: text('product_id').references(() => products.id).notNull(),
    deliveryZoneId: text('delivery_zone_id').references(() => deliveryZones.id).notNull(),
    isAvailable: integer('is_available', { mode: 'boolean' }).default(true).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type ProductDeliveryZoneInsert = typeof productDeliveryZones.$inferInsert;
export type ProductDeliveryZoneSelect = typeof productDeliveryZones.$inferSelect;

// Add after the table definitions, before exports
export const userEmailIndex = index('user_email_idx').on(users.email);
export const productSlugIndex = index('product_slug_idx').on(products.slug);
export const productCategoryIndex = index('product_category_idx').on(products.categoryId);
export const productVendorIndex = index('product_vendor_idx').on(products.vendorId);
export const productStatusIndex = index('product_status_idx').on(products.status);
export const productFeaturedIndex = index('product_featured_idx').on(products.featured);
export const orderUserIndex = index('order_user_idx').on(orders.userId);
export const orderStatusIndex = index('order_status_idx').on(orders.status);
export const orderCreatedIndex = index('order_created_idx').on(orders.createdAt);
export const cartSessionIndex = index('cart_session_idx').on(cartItems.sessionId);
export const photoProductIndex = index('photo_product_idx').on(photos.productId);
export const sessionUserIndex = index('session_user_idx').on(sessions.userId);
export const vendorUserIndex = index('vendor_user_idx').on(vendors.userId);
export const vendorStatusIndex = index('vendor_status_idx').on(vendors.status);
export const reviewProductIndex = index('review_product_idx').on(productReviews.productId);
export const reviewUserIndex = index('review_user_idx').on(productReviews.userId);
export const addressUserIndex = index('address_user_idx').on(userAddresses.userId);
export const discountCodeIndex = index('discount_code_idx').on(discountCodes.code);
export const trackingOrderIndex = index('tracking_order_idx').on(trackingHistory.orderId);
export const trackingTimestampIndex = index('tracking_timestamp_idx').on(trackingHistory.timestamp);