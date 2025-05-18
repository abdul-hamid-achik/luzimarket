import { sqliteTable, text, integer, numeric, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";


export const carts = sqliteTable("carts", {
  id: integer("id").primaryKey(),
  userId: text("user_id"),
  guestId: text("guest_id"),
  createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().defaultNow(),
}, (table) => [
  index("carts_user_id_idx").on(table.userId),
  uniqueIndex("guest_id_idx").on(table.guestId),
]);

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey(),
  cartId: integer("cart_id").notNull().references(() => carts.id),
  productId: text("product_id").notNull(),
  variantId: text("variant_id"),
  quantity: integer("quantity").notNull().default(1),
}, (table) => [
  index("cart_items_cart_id_idx").on(table.cartId),
  index("cart_items_product_id_idx").on(table.productId),
]);

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey(),
  userId: text("user_id"),
  total: numeric("total").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().defaultNow(),
  updatedAt: integer("updated_at", { mode: 'timestamp_ms' }).notNull().defaultNow(),
}, (table) => [
  index("orders_user_id_idx").on(table.userId),
  index("orders_status_idx").on(table.status),
]);

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: text("product_id").notNull(),
  variantId: text("variant_id"),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(),
}, (table) => [
  index("order_items_order_id_idx").on(table.orderId),
  index("order_items_product_id_idx").on(table.productId),
]);

export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey(),
  code: text("code").notNull(),
  discountPercent: integer("discount_percent").notNull(),
  expiresAt: integer("expires_at", { mode: 'timestamp_ms' }),
}, (table) => [
  uniqueIndex("code_idx").on(table.code),
]);

export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey(),
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
