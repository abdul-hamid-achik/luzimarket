CREATE TABLE `cart_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`cart_id` integer NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `cart_items_cart_id_idx` ON `cart_items` (`cart_id`);--> statement-breakpoint
CREATE INDEX `cart_items_product_id_idx` ON `cart_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `carts` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text,
	`guest_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `carts_user_id_idx` ON `carts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `guest_id_idx` ON `carts` (`guest_id`);--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`discount_percent` integer NOT NULL,
	`expires_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `code_idx` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` text NOT NULL,
	`variant_id` text,
	`quantity` integer NOT NULL,
	`price` numeric NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `order_items_order_id_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `order_items_product_id_idx` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` text,
	`total` numeric NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `orders_user_id_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`amount` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sales_date_idx` ON `sales` (`date`);