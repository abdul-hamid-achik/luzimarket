CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true,
	"failed_login_attempts" integer DEFAULT 0,
	"last_failed_login_at" timestamp,
	"locked_until" timestamp,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_backup_codes" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "coupon_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"user_email" text,
	"discount_amount" numeric(10, 2) NOT NULL,
	"used_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"minimum_order_amount" numeric(10, 2),
	"maximum_discount_amount" numeric(10, 2),
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"user_usage_limit" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"starts_at" timestamp,
	"expires_at" timestamp,
	"restrict_to_categories" json,
	"restrict_to_vendors" json,
	"restrict_to_products" json,
	"restrict_to_first_time_customers" boolean DEFAULT false,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "email_templates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"html_template" text NOT NULL,
	"text_template" text,
	"variables" json DEFAULT '[]'::json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "email_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"user_id" uuid,
	"vendor_id" uuid NOT NULL,
	"guest_email" text,
	"guest_name" text,
	"guest_phone" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0' NOT NULL,
	"shipping" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"coupon_code" text,
	"coupon_id" uuid,
	"total" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"payment_intent_id" text,
	"payment_status" text DEFAULT 'pending',
	"shipping_address" json,
	"billing_address" json,
	"notes" text,
	"tracking_number" text,
	"carrier" text,
	"estimated_delivery_date" timestamp,
	"actual_delivery_date" timestamp,
	"tracking_history" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"method" text DEFAULT 'bank_transfer' NOT NULL,
	"stripe_payout_id" text,
	"bank_account_id" uuid,
	"arrival_date" timestamp,
	"failure_reason" text,
	"metadata" json DEFAULT '{}'::json,
	"transaction_ids" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"paid_at" timestamp,
	CONSTRAINT "payouts_stripe_payout_id_unique" UNIQUE("stripe_payout_id")
);
--> statement-breakpoint
CREATE TABLE "platform_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"order_amount" numeric(10, 2) NOT NULL,
	"fee_percentage" numeric(5, 2) NOT NULL,
	"fee_amount" numeric(10, 2) NOT NULL,
	"vendor_earnings" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_application_fee_id" text,
	"stripe_transfer_id" text,
	"created_at" timestamp DEFAULT now(),
	"collected_at" timestamp,
	"transferred_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_image_moderation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"image_index" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"rejection_category" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"variant_type" text NOT NULL,
	"sku" text,
	"price" numeric(10, 2),
	"stock" integer DEFAULT 0,
	"images" json DEFAULT '[]'::json,
	"attributes" json DEFAULT '{}'::json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"images" json DEFAULT '[]'::json,
	"tags" json DEFAULT '[]'::json,
	"brand" text,
	"colors" json DEFAULT '[]'::json,
	"sizes" json DEFAULT '[]'::json,
	"materials" json DEFAULT '[]'::json,
	"features" json DEFAULT '[]'::json,
	"is_active" boolean DEFAULT true,
	"images_approved" boolean DEFAULT false,
	"images_pending_moderation" boolean DEFAULT false,
	"stock" integer DEFAULT 0,
	"weight" integer DEFAULT 0,
	"length" integer DEFAULT 0,
	"width" integer DEFAULT 0,
	"height" integer DEFAULT 0,
	"shipping_class" text DEFAULT 'standard',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"is_verified_purchase" boolean DEFAULT false,
	"helpful_count" integer DEFAULT 0,
	"images" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipping_methods" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shipping_methods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"carrier" text NOT NULL,
	"service_type" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"min_delivery_days" integer NOT NULL,
	"max_delivery_days" integer NOT NULL,
	"tracking_url_pattern" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "shipping_methods_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shipping_zones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"states" json NOT NULL,
	"base_rate_multiplier" numeric(10, 2) DEFAULT '1.0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "shipping_zones_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"reservation_type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"released_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"order_id" uuid,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"description" text,
	"metadata" json DEFAULT '{}'::json,
	"stripe_transfer_id" text,
	"stripe_charge_id" text,
	"stripe_refund_id" text,
	"balance_transaction" json,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"user_type" text NOT NULL,
	"session_token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device" text,
	"browser" text,
	"location" text,
	"last_active" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text,
	"stripe_customer_id" text,
	"is_active" boolean DEFAULT true,
	"email_verified" boolean DEFAULT false,
	"email_verified_at" timestamp,
	"failed_login_attempts" integer DEFAULT 0,
	"last_failed_login_at" timestamp,
	"locked_until" timestamp,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_backup_codes" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendor_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"available_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"pending_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"reserved_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"lifetime_volume" numeric(10, 2) DEFAULT '0' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_balances_vendor_id_unique" UNIQUE("vendor_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"account_holder_name" text NOT NULL,
	"account_holder_type" text NOT NULL,
	"bank_name" text NOT NULL,
	"last4" text NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"country" text DEFAULT 'MX' NOT NULL,
	"is_default" boolean DEFAULT false,
	"stripe_external_account_id" text,
	"metadata" json DEFAULT '{}'::json,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_shipping_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"shipping_method_id" integer NOT NULL,
	"zone_id" integer NOT NULL,
	"min_weight" integer NOT NULL,
	"max_weight" integer NOT NULL,
	"base_rate" numeric(10, 2) NOT NULL,
	"per_kg_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_stripe_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"stripe_account_id" text NOT NULL,
	"account_type" text DEFAULT 'express' NOT NULL,
	"onboarding_status" text DEFAULT 'pending' NOT NULL,
	"charges_enabled" boolean DEFAULT false,
	"payouts_enabled" boolean DEFAULT false,
	"details_submitted" boolean DEFAULT false,
	"requirements" json,
	"capabilities" json,
	"business_profile" json,
	"commission_rate" numeric(5, 2) DEFAULT '15' NOT NULL,
	"payout_schedule" json DEFAULT '{"interval":"daily"}'::json,
	"minimum_payout_amount" numeric(10, 2) DEFAULT '100' NOT NULL,
	"tos_acceptance_date" timestamp,
	"tos_acceptance_ip" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_stripe_accounts_vendor_id_unique" UNIQUE("vendor_id"),
	CONSTRAINT "vendor_stripe_accounts_stripe_account_id_unique" UNIQUE("stripe_account_id")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"slug" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"phone" text,
	"whatsapp" text,
	"business_phone" text,
	"business_hours" text,
	"street" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'México',
	"postal_code" text,
	"website_url" text,
	"description" text,
	"has_delivery" boolean DEFAULT false,
	"delivery_service" text,
	"instagram_url" text,
	"facebook_url" text,
	"tiktok_url" text,
	"twitter_url" text,
	"is_active" boolean DEFAULT false,
	"shipping_origin_state" text,
	"free_shipping_threshold" numeric(10, 2),
	"default_shipping_method_id" integer,
	"shipping_settings" json DEFAULT '{}'::json,
	"failed_login_attempts" integer DEFAULT 0,
	"last_failed_login_at" timestamp,
	"locked_until" timestamp,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_backup_codes" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendors_slug_unique" UNIQUE("slug"),
	CONSTRAINT "vendors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_bank_account_id_vendor_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."vendor_bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fees" ADD CONSTRAINT "platform_fees_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fees" ADD CONSTRAINT "platform_fees_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_moderation" ADD CONSTRAINT "product_image_moderation_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_moderation" ADD CONSTRAINT "product_image_moderation_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_moderation" ADD CONSTRAINT "product_image_moderation_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_balances" ADD CONSTRAINT "vendor_balances_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bank_accounts" ADD CONSTRAINT "vendor_bank_accounts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_shipping_rates" ADD CONSTRAINT "vendor_shipping_rates_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_shipping_rates" ADD CONSTRAINT "vendor_shipping_rates_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_shipping_rates" ADD CONSTRAINT "vendor_shipping_rates_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_stripe_accounts" ADD CONSTRAINT "vendor_stripe_accounts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_default_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("default_shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "coupon_usage_coupon_idx" ON "coupon_usage" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_usage_user_idx" ON "coupon_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_usage_order_idx" ON "coupon_usage" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "coupon_usage_email_idx" ON "coupon_usage" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupons_active_idx" ON "coupons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "coupons_expires_idx" ON "coupons" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_user_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_expires_idx" ON "email_verification_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_vendor_idx" ON "orders" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_guest_email_idx" ON "orders" USING btree ("guest_email");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_expires_idx" ON "password_reset_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "payouts_vendor_idx" ON "payouts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payouts_stripe_payout_idx" ON "payouts" USING btree ("stripe_payout_id");--> statement-breakpoint
CREATE INDEX "payouts_created_idx" ON "payouts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "platform_fees_order_idx" ON "platform_fees" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "platform_fees_vendor_idx" ON "platform_fees" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "platform_fees_status_idx" ON "platform_fees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_image_moderation_product_idx" ON "product_image_moderation" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_image_moderation_vendor_idx" ON "product_image_moderation" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "product_image_moderation_status_idx" ON "product_image_moderation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_image_moderation_created_at_idx" ON "product_image_moderation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "variants_type_idx" ON "product_variants" USING btree ("variant_type");--> statement-breakpoint
CREATE INDEX "variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_vendor_idx" ON "products" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "reservations_product_idx" ON "stock_reservations" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reservations_user_idx" ON "stock_reservations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reservations_session_idx" ON "stock_reservations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "reservations_expires_idx" ON "stock_reservations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "subscriptions_email_idx" ON "subscriptions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "transactions_vendor_idx" ON "transactions" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "transactions_order_idx" ON "transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_created_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "vendor_balances_vendor_idx" ON "vendor_balances" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_bank_accounts_vendor_idx" ON "vendor_bank_accounts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_bank_accounts_stripe_idx" ON "vendor_bank_accounts" USING btree ("stripe_external_account_id");--> statement-breakpoint
CREATE INDEX "vendor_shipping_rates_vendor_idx" ON "vendor_shipping_rates" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_shipping_rates_method_idx" ON "vendor_shipping_rates" USING btree ("shipping_method_id");--> statement-breakpoint
CREATE INDEX "vendor_shipping_rates_zone_idx" ON "vendor_shipping_rates" USING btree ("zone_id");--> statement-breakpoint
CREATE INDEX "vendor_stripe_accounts_vendor_idx" ON "vendor_stripe_accounts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_stripe_accounts_stripe_idx" ON "vendor_stripe_accounts" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "vendor_stripe_accounts_status_idx" ON "vendor_stripe_accounts" USING btree ("onboarding_status");--> statement-breakpoint
CREATE INDEX "vendors_email_idx" ON "vendors" USING btree ("email");--> statement-breakpoint
CREATE INDEX "vendors_business_name_idx" ON "vendors" USING btree ("business_name");--> statement-breakpoint
CREATE INDEX "vendors_slug_idx" ON "vendors" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "wishlists_user_idx" ON "wishlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wishlists_product_idx" ON "wishlists" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "wishlists_unique_idx" ON "wishlists" USING btree ("user_id","product_id");