import { sqliteTable, text, integer, numeric, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

export const carts = sqliteTable("carts", {
  id: text("id").primaryKey(),
  userId: integer("user_id"),
  guestId: text("guest_id"),
  createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().defaultNow(),
}, (table) => [
  index("carts_user_id_idx").on(table.userId),
  uniqueIndex("guest_id_idx").on(table.guestId),
]);

export const cartItems = sqliteTable("cart_items", {
  id: text("id").primaryKey(),
  cartId: text("cart_id").notNull().references(() => carts.id),
  productId: integer("product_id").notNull(),
  variantId: integer("variant_id"),
  quantity: integer("quantity").notNull().default(1),
}, (table) => [
  index("cart_items_cart_id_idx").on(table.cartId),
  index("cart_items_product_id_idx").on(table.productId),
]);

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: integer("user_id"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().defaultNow(),
  updatedAt: integer("updated_at", { mode: 'timestamp_ms' }).notNull().defaultNow(),
}, (table) => [
  index("orders_user_id_idx").on(table.userId),
  index("orders_status_idx").on(table.status),
]);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull(),
  variantId: integer("variant_id"),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
  index("order_items_product_id_idx").on(table.productId),
]);

export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  discountPercent: integer("discount_percent").notNull(),
  expiresAt: integer("expires_at", { mode: 'timestamp_ms' }),
}, (table) => [
  uniqueIndex("code_idx").on(table.code),
]);

export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(),
  date: integer("date", { mode: 'timestamp_ms' }).notNull(),
  amount: integer("amount").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().defaultNow(),
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
