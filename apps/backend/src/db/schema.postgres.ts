import { pgTable, text, timestamp, serial, integer, json, boolean } from 'drizzle-orm/pg-core';
import { generatePrefixedId, ID_PATTERNS } from '../lib/ids';

// Define delivery zones first (referenced by users)
export const deliveryZones = pgTable('delivery_zones', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.DELIVERY)),
    name: text('name').notNull(),
    fee: integer('fee').notNull().default(0),
    isActive: boolean('is_active').default(true).notNull(),
    description: text('description'),
});

export type DeliveryZoneInsert = typeof deliveryZones.$inferInsert;
export type DeliveryZoneSelect = typeof deliveryZones.$inferSelect;

// Users table for authentication
export const users = pgTable('users', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.USER)),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    name: text('name'),
    stripe_customer_id: text('stripe_customer_id'),
    role: text('role', { enum: ['customer', 'employee', 'admin', 'vendor'] }).default('customer').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    preferredDeliveryZoneId: text('preferred_delivery_zone_id').references(() => deliveryZones.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserInsert = typeof users.$inferInsert;
export type UserSelect = typeof users.$inferSelect;

export const empleados = pgTable('empleados', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.EMPLOYEE)),
    nombre: text('nombre').notNull(),
    puesto: text('puesto').notNull(),
    email: text('email').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type EmpleadoInsert = typeof empleados.$inferInsert;
export type EmpleadoSelect = typeof empleados.$inferSelect;

// Vendors table 
export const vendors = pgTable('vendors', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.VENDOR)),
    userId: text('user_id').references(() => users.id).notNull(),
    businessName: text('business_name').notNull(),
    contactPerson: text('contact_person').notNull(),
    phone: text('phone').notNull(),
    address: text('address').notNull(),
    taxId: text('tax_id'),
    commissionRate: integer('commission_rate').default(10).notNull(), // percentage
    status: text('status', { enum: ['pending', 'approved', 'suspended', 'rejected'] }).default('pending').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type VendorInsert = typeof vendors.$inferInsert;
export type VendorSelect = typeof vendors.$inferSelect;

// Categories for products and CMS occasions
export const categories = pgTable('categories', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.CATEGORY)),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    imageUrl: text('image_url'),
});

// Products and variants
export const products = pgTable('products', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.PRODUCT)),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    price: integer('price').notNull(),
    categoryId: text('category_id').references(() => categories.id),
    vendorId: text('vendor_id').references(() => vendors.id),
    status: text('status', { enum: ['draft', 'active', 'inactive', 'out_of_stock'] }).default('draft').notNull(),
    featured: boolean('featured').default(false).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const productVariants = pgTable('product_variants', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.VARIANT)),
    productId: text('product_id').references(() => products.id),
    sku: text('sku').notNull().unique(),
    attributes: json('attributes').notNull(), // Kept as json for PostgreSQL
    stock: integer('stock').notNull().default(0),
});

export const photos = pgTable('photos', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.PHOTO)),
    url: text('url').notNull(),
    alt: text('alt_text'),
    sortOrder: integer('sort_order').default(0).notNull(),
    productId: text('product_id').references(() => products.id),
});

// Guest & user sessions for cart
export const sessions = pgTable('sessions', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.SESSION)),
    userId: text('user_id').references(() => users.id),
    isGuest: boolean('is_guest').notNull().default(true),
    deliveryZoneId: text('delivery_zone_id').references(() => deliveryZones.id),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const cartItems = pgTable('cart_items', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.CART)),
    sessionId: text('session_id').references(() => sessions.id),
    variantId: text('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull().default(1),
});

export const states = pgTable('states', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.STATE)),
    label: text('label').notNull(),
    value: text('value').notNull().unique(),
});

// Orders & order items
export const orders = pgTable('orders', {
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
    shipped_at: timestamp('shipped_at'),
    estimated_delivery: timestamp('estimated_delivery'),
    delivered_at: timestamp('delivered_at'),
    delivery_notes: text('delivery_notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const orderItems = pgTable('order_items', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.CART)),
    orderId: text('order_id').references(() => orders.id),
    variantId: text('variant_id').references(() => productVariants.id),
    quantity: integer('quantity').notNull(),
    price: integer('price_at_purchase').notNull(),
});

// Brands, occasions, editorial, favorites, petitions for CMS
export const brands = pgTable('brands', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.BRAND)),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    website: text('website').notNull(),
});

export const occasions = pgTable('occasions', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.OCCASION)),
    name: text('name').notNull(),
    description: text('description').notNull(),
    slug: text('slug').notNull().unique(),
});

export const editorialArticles = pgTable('editorial_articles', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.ARTICLE)),
    title: text('title').notNull(),
    content: text('content').notNull(),
    author: text('author').notNull(),
    slug: text('slug').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const favorites = pgTable('favorites', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.CART)),
    userId: text('user_id').references(() => users.id),
    variantId: text('variant_id').references(() => productVariants.id),
});

export const petitions = pgTable('petitions', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.PETITION)),
    type: text('type').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Bundles for grouping products
export const bundles = pgTable('bundles', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.BUNDLE)),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bundleItems = pgTable('bundle_items', {
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

// Refresh tokens table for JWT token refresh functionality
export const refreshTokens = pgTable('refresh_tokens', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.TOKEN)),
    userId: text('user_id').references(() => users.id).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    isRevoked: boolean('is_revoked').default(false).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type RefreshTokenInsert = typeof refreshTokens.$inferInsert;
export type RefreshTokenSelect = typeof refreshTokens.$inferSelect;

// Homepage banners/slides for CMS management
export const homepageSlides = pgTable('homepage_slides', {
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
    isActive: boolean('is_active').default(true).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type HomepageSlideInsert = typeof homepageSlides.$inferInsert;
export type HomepageSlideSelect = typeof homepageSlides.$inferSelect;

// Product Reviews & Ratings
export const productReviews = pgTable('product_reviews', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.REVIEW)),
    productId: text('product_id').references(() => products.id).notNull(),
    userId: text('user_id').references(() => users.id).notNull(),
    rating: integer('rating').notNull(), // 1-5 stars
    title: text('title').notNull(),
    comment: text('comment').notNull(),
    isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
    isApproved: boolean('is_approved').default(false).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ProductReviewInsert = typeof productReviews.$inferInsert;
export type ProductReviewSelect = typeof productReviews.$inferSelect;

// User Shipping Addresses
export const userAddresses = pgTable('user_addresses', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.ADDRESS)),
    userId: text('user_id').references(() => users.id).notNull(),
    type: text('type', { enum: ['shipping', 'billing'] }).default('shipping').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    fullName: text('full_name').notNull(),
    street: text('street').notNull(),
    city: text('city').notNull(),
    state: text('state').notNull(),
    postalCode: text('postal_code').notNull(),
    country: text('country').default('México').notNull(),
    phone: text('phone'),
    instructions: text('delivery_instructions'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type UserAddressInsert = typeof userAddresses.$inferInsert;
export type UserAddressSelect = typeof userAddresses.$inferSelect;

// Discount Codes & Coupons
export const discountCodes = pgTable('discount_codes', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.DISCOUNT)),
    code: text('code').notNull().unique(),
    type: text('type', { enum: ['percentage', 'fixed_amount', 'free_shipping'] }).notNull(),
    value: integer('value').notNull(), // percentage (1-100) or amount in centavos
    minOrderAmount: integer('min_order_amount').default(0).notNull(),
    maxUses: integer('max_uses'),
    usedCount: integer('used_count').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type DiscountCodeInsert = typeof discountCodes.$inferInsert;
export type DiscountCodeSelect = typeof discountCodes.$inferSelect;

// Order Addresses (snapshot of shipping info at order time)
export const orderAddresses = pgTable('order_addresses', {
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
export const trackingHistory = pgTable('tracking_history', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.TRACKING)),
    orderId: text('order_id').references(() => orders.id).notNull(),
    status: text('status').notNull(), // in_transit, out_for_delivery, delivered, exception, etc.
    description: text('description').notNull(),
    location: text('location'), // Ciudad, Estado, País
    timestamp: timestamp('timestamp').notNull(),
    carrier_status: text('carrier_status'), // Raw status from carrier
    created_at: timestamp('created_at').notNull().defaultNow(),
});

export type TrackingHistoryInsert = typeof trackingHistory.$inferInsert;
export type TrackingHistorySelect = typeof trackingHistory.$inferSelect;

// Many-to-many relationship between products and delivery zones
export const productDeliveryZones = pgTable('product_delivery_zones', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.DELIVERY)),
    productId: text('product_id').references(() => products.id).notNull(),
    deliveryZoneId: text('delivery_zone_id').references(() => deliveryZones.id).notNull(),
    isAvailable: boolean('is_available').default(true).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ProductDeliveryZoneInsert = typeof productDeliveryZones.$inferInsert;
export type ProductDeliveryZoneSelect = typeof productDeliveryZones.$inferSelect;

// Notifications/Alerts system for admin dashboard
export const notifications = pgTable('notifications', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.NOTIFICATION)),
    type: text('type').notNull(), // vendor_request, low_stock, payment_failed, delivery_issue, system_maintenance, high_sales, etc.
    severity: text('severity', { enum: ['info', 'warning', 'error', 'success'] }).default('info').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    category: text('category').notNull(), // vendors, orders, inventory, payments, petitions, system, sales
    actionRequired: boolean('action_required').default(false).notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    userId: text('user_id').references(() => users.id), // Optional: specific user, null for system-wide
    relatedEntityId: text('related_entity_id'), // ID of related order, product, user, etc.
    relatedEntityType: text('related_entity_type'), // order, product, user, vendor, etc.
    data: json('data'), // Additional data for the notification
    expiresAt: timestamp('expires_at'), // Optional: auto-expire notifications
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type NotificationInsert = typeof notifications.$inferInsert;
export type NotificationSelect = typeof notifications.$inferSelect;

// Delivery zone schedules for horarios management
export const deliveryZoneSchedules = pgTable('delivery_zone_schedules', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.DELIVERY)),
    deliveryZoneId: text('delivery_zone_id').references(() => deliveryZones.id).notNull(),
    dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
    openTime: text('open_time').notNull(), // HH:MM format
    closeTime: text('close_time').notNull(), // HH:MM format
    isEnabled: boolean('is_enabled').default(true).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type DeliveryZoneScheduleInsert = typeof deliveryZoneSchedules.$inferInsert;
export type DeliveryZoneScheduleSelect = typeof deliveryZoneSchedules.$inferSelect;

// Special delivery hours (holidays, special events, etc.)
export const deliveryZoneSpecialHours = pgTable('delivery_zone_special_hours', {
    id: text('id').primaryKey().$defaultFn(() => generatePrefixedId(ID_PATTERNS.DELIVERY)),
    deliveryZoneId: text('delivery_zone_id').references(() => deliveryZones.id).notNull(),
    date: text('date').notNull(), // YYYY-MM-DD format
    openTime: text('open_time'), // HH:MM format, null if closed
    closeTime: text('close_time'), // HH:MM format, null if closed
    isClosed: boolean('is_closed').default(false).notNull(),
    description: text('description'), // "Holiday", "Special Event", etc.
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type DeliveryZoneSpecialHoursInsert = typeof deliveryZoneSpecialHours.$inferInsert;
export type DeliveryZoneSpecialHoursSelect = typeof deliveryZoneSpecialHours.$inferSelect;