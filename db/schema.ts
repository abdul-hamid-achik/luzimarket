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

// ============================================
// STRIPE CONNECT TABLES
// ============================================

// Vendor Balances table
export const vendorBalances = pgTable("vendor_balances", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }).unique(),
  availableBalance: decimal("available_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  pendingBalance: decimal("pending_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  reservedBalance: decimal("reserved_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("MXN"),
  lifetimeVolume: decimal("lifetime_volume", { precision: 10, scale: 2 }).notNull().default("0"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  vendorIdx: index("vendor_balances_vendor_idx").on(table.vendorId),
}));

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  orderId: uuid("order_id").references(() => orders.id),
  type: text("type").notNull(), // 'sale', 'refund', 'payout', 'fee', 'adjustment', 'transfer'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MXN"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed', 'cancelled'
  description: text("description"),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  stripeTransferId: text("stripe_transfer_id"),
  stripeChargeId: text("stripe_charge_id"),
  stripeRefundId: text("stripe_refund_id"),
  balanceTransaction: json("balance_transaction").$type<{
    before: { available: number; pending: number; reserved: number };
    after: { available: number; pending: number; reserved: number };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  vendorIdx: index("transactions_vendor_idx").on(table.vendorId),
  orderIdx: index("transactions_order_idx").on(table.orderId),
  typeIdx: index("transactions_type_idx").on(table.type),
  statusIdx: index("transactions_status_idx").on(table.status),
  createdIdx: index("transactions_created_idx").on(table.createdAt),
}));

// Payouts table
export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MXN"),
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'paid', 'failed', 'cancelled'
  method: text("method").notNull().default("bank_transfer"), // 'bank_transfer', 'card'
  stripePayoutId: text("stripe_payout_id").unique(),
  bankAccountId: uuid("bank_account_id").references(() => vendorBankAccounts.id),
  arrivalDate: timestamp("arrival_date"),
  failureReason: text("failure_reason"),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  transactionIds: json("transaction_ids").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  paidAt: timestamp("paid_at"),
}, (table) => ({
  vendorIdx: index("payouts_vendor_idx").on(table.vendorId),
  statusIdx: index("payouts_status_idx").on(table.status),
  stripePayoutIdx: index("payouts_stripe_payout_idx").on(table.stripePayoutId),
  createdIdx: index("payouts_created_idx").on(table.createdAt),
}));

// Platform Fees table
export const platformFees = pgTable("platform_fees", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  orderAmount: decimal("order_amount", { precision: 10, scale: 2 }).notNull(),
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }).notNull(),
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull(),
  vendorEarnings: decimal("vendor_earnings", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("MXN"),
  status: text("status").notNull().default("pending"), // 'pending', 'collected', 'transferred', 'refunded'
  stripeApplicationFeeId: text("stripe_application_fee_id"),
  stripeTransferId: text("stripe_transfer_id"),
  createdAt: timestamp("created_at").defaultNow(),
  collectedAt: timestamp("collected_at"),
  transferredAt: timestamp("transferred_at"),
}, (table) => ({
  orderIdx: index("platform_fees_order_idx").on(table.orderId),
  vendorIdx: index("platform_fees_vendor_idx").on(table.vendorId),
  statusIdx: index("platform_fees_status_idx").on(table.status),
}));

// Vendor Bank Accounts table
export const vendorBankAccounts = pgTable("vendor_bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  accountHolderName: text("account_holder_name").notNull(),
  accountHolderType: text("account_holder_type").notNull(), // 'individual' or 'company'
  bankName: text("bank_name").notNull(),
  last4: text("last4").notNull(),
  currency: text("currency").notNull().default("MXN"),
  country: text("country").notNull().default("MX"),
  isDefault: boolean("is_default").default(false),
  stripeExternalAccountId: text("stripe_external_account_id"),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  vendorIdx: index("vendor_bank_accounts_vendor_idx").on(table.vendorId),
  stripeAccountIdx: index("vendor_bank_accounts_stripe_idx").on(table.stripeExternalAccountId),
}));

// Vendor Stripe Connect Configuration
export const vendorStripeAccounts = pgTable("vendor_stripe_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }).unique(),
  stripeAccountId: text("stripe_account_id").notNull().unique(),
  accountType: text("account_type").notNull().default("express"), // 'express', 'standard', 'custom'
  onboardingStatus: text("onboarding_status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'rejected'
  chargesEnabled: boolean("charges_enabled").default(false),
  payoutsEnabled: boolean("payouts_enabled").default(false),
  detailsSubmitted: boolean("details_submitted").default(false),
  requirements: json("requirements").$type<{
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
    pendingVerification: string[];
    errors: Array<{ code: string; reason: string; requirement: string }>;
  }>(),
  capabilities: json("capabilities").$type<{
    card_payments?: string;
    transfers?: string;
    tax_reporting_mx?: string;
    [key: string]: string | undefined;
  }>(),
  businessProfile: json("business_profile").$type<{
    mcc?: string;
    name?: string;
    url?: string;
    supportEmail?: string;
    supportPhone?: string;
    [key: string]: any;
  }>(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("15"), // Platform commission percentage
  payoutSchedule: json("payout_schedule").$type<{
    interval: 'daily' | 'weekly' | 'monthly' | 'manual';
    weekly_anchor?: string;
    monthly_anchor?: number;
    delay_days?: number;
  }>().default({ interval: 'daily' }),
  minimumPayoutAmount: decimal("minimum_payout_amount", { precision: 10, scale: 2 }).notNull().default("100"), // Minimum amount for automatic payouts
  tosAcceptanceDate: timestamp("tos_acceptance_date"),
  tosAcceptanceIp: text("tos_acceptance_ip"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  vendorIdx: index("vendor_stripe_accounts_vendor_idx").on(table.vendorId),
  stripeAccountIdx: index("vendor_stripe_accounts_stripe_idx").on(table.stripeAccountId),
  statusIdx: index("vendor_stripe_accounts_status_idx").on(table.onboardingStatus),
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
  // Stripe Connect relations
  stripeAccount: one(vendorStripeAccounts),
  balance: one(vendorBalances),
  transactions: many(transactions),
  payouts: many(payouts),
  bankAccounts: many(vendorBankAccounts),
  platformFees: many(platformFees),
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

// ============================================
// STRIPE CONNECT RELATIONS
// ============================================

export const vendorBalanceRelations = relations(vendorBalances, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorBalances.vendorId],
    references: [vendors.id],
  }),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  vendor: one(vendors, {
    fields: [transactions.vendorId],
    references: [vendors.id],
  }),
  order: one(orders, {
    fields: [transactions.orderId],
    references: [orders.id],
  }),
}));

export const payoutRelations = relations(payouts, ({ one }) => ({
  vendor: one(vendors, {
    fields: [payouts.vendorId],
    references: [vendors.id],
  }),
  bankAccount: one(vendorBankAccounts, {
    fields: [payouts.bankAccountId],
    references: [vendorBankAccounts.id],
  }),
}));

export const platformFeeRelations = relations(platformFees, ({ one }) => ({
  order: one(orders, {
    fields: [platformFees.orderId],
    references: [orders.id],
  }),
  vendor: one(vendors, {
    fields: [platformFees.vendorId],
    references: [vendors.id],
  }),
}));

export const vendorBankAccountRelations = relations(vendorBankAccounts, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [vendorBankAccounts.vendorId],
    references: [vendors.id],
  }),
  payouts: many(payouts),
}));

export const vendorStripeAccountRelations = relations(vendorStripeAccounts, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorStripeAccounts.vendorId],
    references: [vendors.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

// Stripe Connect Types
export type VendorBalance = typeof vendorBalances.$inferSelect;
export type NewVendorBalance = typeof vendorBalances.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;

export type PlatformFee = typeof platformFees.$inferSelect;
export type NewPlatformFee = typeof platformFees.$inferInsert;

export type VendorBankAccount = typeof vendorBankAccounts.$inferSelect;
export type NewVendorBankAccount = typeof vendorBankAccounts.$inferInsert;

export type VendorStripeAccount = typeof vendorStripeAccounts.$inferSelect;
export type NewVendorStripeAccount = typeof vendorStripeAccounts.$inferInsert;