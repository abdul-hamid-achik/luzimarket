import { pgTable, text, timestamp, boolean, integer, decimal, json, uuid, varchar, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Vendors table
export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: text("business_name").notNull(),
  slug: text("slug").notNull().unique(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  businessPhone: text("business_phone"),
  businessHours: text("business_hours"),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  country: text("country").default("México"),
  postalCode: text("postal_code"),
  websiteUrl: text("website_url"),
  description: text("description"),
  hasDelivery: boolean("has_delivery").default(false),
  deliveryService: text("delivery_service"),
  instagramUrl: text("instagram_url"),
  facebookUrl: text("facebook_url"),
  tiktokUrl: text("tiktok_url"),
  twitterUrl: text("twitter_url"),
  isActive: boolean("is_active").default(false),
  // Shipping fields
  shippingOriginState: text("shipping_origin_state"),
  freeShippingThreshold: decimal("free_shipping_threshold", { precision: 10, scale: 2 }),
  defaultShippingMethodId: integer("default_shipping_method_id").references(() => shippingMethods.id),
  shippingSettings: json("shipping_settings").$type<{
    enabledMethods?: string[];
    packagingFee?: number;
    handlingTime?: number;
  }>().default({}),
  // Account lockout fields
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lastFailedLoginAt: timestamp("last_failed_login_at"),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    emailIdx: index("vendors_email_idx").on(table.email),
    businessNameIdx: index("vendors_business_name_idx").on(table.businessName),
    slugIdx: index("vendors_slug_idx").on(table.slug),
  }
});

// Categories table
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    slugIdx: index("categories_slug_idx").on(table.slug),
  }
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  images: json("images").$type<string[]>().default([]),
  tags: json("tags").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  stock: integer("stock").default(0),
  // Shipping fields
  weight: integer("weight").default(0), // in grams
  length: integer("length").default(0), // in cm
  width: integer("width").default(0), // in cm
  height: integer("height").default(0), // in cm
  shippingClass: text("shipping_class").default("standard"), // standard, fragile, oversize, dangerous
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    vendorIdx: index("products_vendor_idx").on(table.vendorId),
    categoryIdx: index("products_category_idx").on(table.categoryId),
    slugIdx: index("products_slug_idx").on(table.slug),
    nameIdx: index("products_name_idx").on(table.name),
  }
});

// Email subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    emailIdx: index("subscriptions_email_idx").on(table.email),
  }
});

// Users table for customers
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  stripeCustomerId: text("stripe_customer_id"),
  isActive: boolean("is_active").default(true),
  // Email verification fields
  emailVerified: boolean("email_verified").default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  // Account lockout fields
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lastFailedLoginAt: timestamp("last_failed_login_at"),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
}));

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: text("order_number").notNull().unique(),
  userId: uuid("user_id").references(() => users.id),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  // Guest order fields
  guestEmail: text("guest_email"),
  guestName: text("guest_name"),
  guestPhone: text("guest_phone"),
  status: text("status").notNull().default("pending"), // pending, paid, shipped, delivered, cancelled
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  shipping: decimal("shipping", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MXN"),
  paymentIntentId: text("payment_intent_id"),
  paymentStatus: text("payment_status").default("pending"), // pending, succeeded, failed
  shippingAddress: json("shipping_address").$type<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>(),
  billingAddress: json("billing_address").$type<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>(),
  notes: text("notes"),
  // Tracking information
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"), // e.g., "fedex", "ups", "dhl", "estafeta"
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  trackingHistory: json("tracking_history").$type<Array<{
    status: string;
    location: string;
    timestamp: Date;
    description: string;
    coordinates?: { lat: number; lng: number };
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orderNumberIdx: index("orders_order_number_idx").on(table.orderNumber),
  userIdx: index("orders_user_idx").on(table.userId),
  vendorIdx: index("orders_vendor_idx").on(table.vendorId),
  statusIdx: index("orders_status_idx").on(table.status),
  guestEmailIdx: index("orders_guest_email_idx").on(table.guestEmail),
}));

// Order items table
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  orderIdx: index("order_items_order_idx").on(table.orderId),
  productIdx: index("order_items_product_idx").on(table.productId),
}));

// Admin users table
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // admin, super_admin
  isActive: boolean("is_active").default(true),
  // Account lockout fields
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lastFailedLoginAt: timestamp("last_failed_login_at"),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("admin_users_email_idx").on(table.email),
}));

// Email templates table
export const emailTemplates = pgTable("email_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  subject: text("subject").notNull(),
  htmlTemplate: text("html_template").notNull(),
  textTemplate: text("text_template"),
  variables: json("variables").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shipping zones table
export const shippingZones = pgTable("shipping_zones", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  states: json("states").$type<string[]>().notNull(),
  baseRateMultiplier: decimal("base_rate_multiplier", { precision: 10, scale: 2 }).notNull().default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shipping methods table
export const shippingMethods = pgTable("shipping_methods", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  carrier: text("carrier").notNull(),
  serviceType: text("service_type").notNull(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  minDeliveryDays: integer("min_delivery_days").notNull(),
  maxDeliveryDays: integer("max_delivery_days").notNull(),
  trackingUrlPattern: text("tracking_url_pattern"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendor shipping rates table
export const vendorShippingRates = pgTable("vendor_shipping_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  shippingMethodId: integer("shipping_method_id").notNull().references(() => shippingMethods.id),
  zoneId: integer("zone_id").notNull().references(() => shippingZones.id),
  minWeight: integer("min_weight").notNull(), // in grams
  maxWeight: integer("max_weight").notNull(), // in grams
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
  perKgRate: decimal("per_kg_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  vendorIdx: index("vendor_shipping_rates_vendor_idx").on(table.vendorId),
  methodIdx: index("vendor_shipping_rates_method_idx").on(table.shippingMethodId),
  zoneIdx: index("vendor_shipping_rates_zone_idx").on(table.zoneId),
}));

// Relations
export const vendorsRelations = relations(vendors, ({ many, one }) => ({
  products: many(products),
  orders: many(orders),
  shippingRates: many(vendorShippingRates),
  defaultShippingMethod: one(shippingMethods, {
    fields: [vendors.defaultShippingMethodId],
    references: [shippingMethods.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
  reviews: many(reviews),
  variants: many(productVariants),
}));

export const userRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  reviews: many(reviews),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  vendor: one(vendors, {
    fields: [orders.vendorId],
    references: [vendors.id],
  }),
  items: many(orderItems),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Product Reviews table
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id),
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  comment: text("comment"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  helpfulCount: integer("helpful_count").default(0),
  images: json("images").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    productIdx: index("reviews_product_idx").on(table.productId),
    userIdx: index("reviews_user_idx").on(table.userId),
    ratingIdx: index("reviews_rating_idx").on(table.rating),
  }
});

export const reviewRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));

// Password Reset Tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
    userIdx: index("password_reset_tokens_user_idx").on(table.userId),
    expiresIdx: index("password_reset_tokens_expires_idx").on(table.expiresAt),
  }
});

export const passwordResetTokenRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Email Verification Tokens table
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    tokenIdx: index("email_verification_tokens_token_idx").on(table.token),
    userIdx: index("email_verification_tokens_user_idx").on(table.userId),
    expiresIdx: index("email_verification_tokens_expires_idx").on(table.expiresAt),
  }
});

export const emailVerificationTokenRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [emailVerificationTokens.userId],
    references: [users.id],
  }),
}));

// Shipping relations
export const shippingZoneRelations = relations(shippingZones, ({ many }) => ({
  vendorRates: many(vendorShippingRates),
}));

export const shippingMethodRelations = relations(shippingMethods, ({ many }) => ({
  vendorRates: many(vendorShippingRates),
  vendors: many(vendors),
}));

export const vendorShippingRateRelations = relations(vendorShippingRates, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorShippingRates.vendorId],
    references: [vendors.id],
  }),
  shippingMethod: one(shippingMethods, {
    fields: [vendorShippingRates.shippingMethodId],
    references: [shippingMethods.id],
  }),
  zone: one(shippingZones, {
    fields: [vendorShippingRates.zoneId],
    references: [shippingZones.id],
  }),
}));

// Stock Reservations
export const stockReservations = pgTable("stock_reservations", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: text("session_id"), // For guest users
  reservationType: text("reservation_type").notNull(), // 'cart' or 'checkout'
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  releasedAt: timestamp("released_at"), // When the reservation was released
}, (table) => ({
  productIdx: index("reservations_product_idx").on(table.productId),
  userIdx: index("reservations_user_idx").on(table.userId),
  sessionIdx: index("reservations_session_idx").on(table.sessionId),
  expiresIdx: index("reservations_expires_idx").on(table.expiresAt),
}));

export const stockReservationRelations = relations(stockReservations, ({ one }) => ({
  product: one(products, {
    fields: [stockReservations.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [stockReservations.userId],
    references: [users.id],
  }),
}));

// Product Variants
export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "Small", "Red", "Cotton"
  variantType: text("variant_type").notNull(), // e.g., "size", "color", "material"
  sku: text("sku").unique(),
  price: decimal("price", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0),
  images: json("images").$type<string[]>().default([]),
  attributes: json("attributes").$type<Record<string, any>>().default({}), // Additional variant-specific attributes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  productIdx: index("variants_product_idx").on(table.productId),
  typeIdx: index("variants_type_idx").on(table.variantType),
  skuIdx: index("variants_sku_idx").on(table.sku),
}));

export const productVariantRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));