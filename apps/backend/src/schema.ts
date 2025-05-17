import { pgTable, varchar, integer, timestamp, numeric, uniqueIndex, index } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const carts = pgTable("carts", {
  id: varchar("id", { length: 26 }).primaryKey(),
  userId: integer("user_id"),
  guestId: varchar("guest_id", { length: 36 }),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => [
  index("carts_user_id_idx").on(table.userId),
  uniqueIndex("guest_id_idx").on(table.guestId),
]);

export const cartItems = pgTable("cart_items", {
  id: varchar("id", { length: 26 }).primaryKey(),
  cartId: varchar("cart_id", { length: 26 }).notNull().references(() => carts.id),
  productId: integer("product_id").notNull(),
  variantId: integer("variant_id"),
  quantity: integer("quantity").notNull().default(sql`1`),
}, (table) => [
  index("cart_items_cart_id_idx").on(table.cartId),
  index("cart_items_product_id_idx").on(table.productId),
]);

export const orders = pgTable("orders", {
  id: varchar("id", { length: 26 }).primaryKey(),
  userId: integer("user_id"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => [
  index("orders_user_id_idx").on(table.userId),
  index("orders_status_idx").on(table.status),
]);

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 26 }).primaryKey(),
  orderId: varchar("order_id", { length: 26 }).notNull().references(() => orders.id),
  productId: integer("product_id").notNull(),
  variantId: integer("variant_id"),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
  index("order_items_product_id_idx").on(table.productId),
]);

export const coupons = pgTable("coupons", {
  id: varchar("id", { length: 26 }).primaryKey(),
  code: varchar("code", { length: 50 }).notNull(),
  discountPercent: integer("discount_percent").notNull(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  uniqueIndex("code_idx").on(table.code),
]);

export const sales = pgTable("sales", {
  id: varchar("id", { length: 26 }).primaryKey(),
  date: timestamp("date").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => [
  index("sales_date_idx").on(table.date),
]);

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
