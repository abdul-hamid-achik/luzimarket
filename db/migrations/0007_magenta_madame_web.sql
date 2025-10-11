CREATE TABLE "analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid,
	"snapshot_date" timestamp NOT NULL,
	"metrics_data" json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cart_abandonment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"user_id" uuid,
	"user_email" text,
	"products_data" json NOT NULL,
	"cart_total" numeric(10, 2) NOT NULL,
	"recovered_at" timestamp,
	"recovery_email_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"order_id" uuid,
	"subject" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"alert_type" text NOT NULL,
	"threshold" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_type" text NOT NULL,
	"content" text NOT NULL,
	"attachments" json,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "return_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"items_to_return" json NOT NULL,
	"reason" text NOT NULL,
	"reason_category" text NOT NULL,
	"description" text,
	"images" json,
	"status" text DEFAULT 'pending' NOT NULL,
	"refund_amount" numeric(10, 2) NOT NULL,
	"restocking_fee" numeric(10, 2) DEFAULT '0',
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"refund_id" text,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_helpful_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vote_type" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shipping_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"label_url" text NOT NULL,
	"carrier" text NOT NULL,
	"service_type" text NOT NULL,
	"tracking_number" text,
	"label_format" text DEFAULT 'pdf',
	"cost" numeric(10, 2),
	"weight" integer,
	"dimensions" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "vendor_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"page_type" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_review_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"response_text" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_review_responses_review_id_unique" UNIQUE("review_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"permissions" json DEFAULT '{}'::json,
	"invited_at" timestamp DEFAULT now(),
	"accepted_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "vendor_id" uuid;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "coupon_scope" text DEFAULT 'platform' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipped_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_keywords" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "structured_data" json;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "inventory_settings" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "banner_image_url" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "brand_colors" json;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "about_text" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "featured_products" json;--> statement-breakpoint
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_abandonment" ADD CONSTRAINT "cart_abandonment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_alerts" ADD CONSTRAINT "inventory_alerts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_helpful_votes" ADD CONSTRAINT "review_helpful_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_labels" ADD CONSTRAINT "shipping_labels_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_labels" ADD CONSTRAINT "shipping_labels_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_invitations" ADD CONSTRAINT "vendor_invitations_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_pages" ADD CONSTRAINT "vendor_pages_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_review_responses" ADD CONSTRAINT "vendor_review_responses_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_review_responses" ADD CONSTRAINT "vendor_review_responses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_team_members" ADD CONSTRAINT "vendor_team_members_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_team_members" ADD CONSTRAINT "vendor_team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_snapshots_vendor_idx" ON "analytics_snapshots" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "analytics_snapshots_date_idx" ON "analytics_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "analytics_snapshots_unique_idx" ON "analytics_snapshots" USING btree ("vendor_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "cart_abandonment_session_idx" ON "cart_abandonment" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "cart_abandonment_user_idx" ON "cart_abandonment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_abandonment_email_idx" ON "cart_abandonment" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "cart_abandonment_recovered_idx" ON "cart_abandonment" USING btree ("recovered_at");--> statement-breakpoint
CREATE INDEX "conversations_customer_idx" ON "conversations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "conversations_vendor_idx" ON "conversations" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "conversations_status_idx" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversations_last_message_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "inventory_alerts_vendor_idx" ON "inventory_alerts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "inventory_alerts_product_idx" ON "inventory_alerts" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "inventory_alerts_type_idx" ON "inventory_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "return_requests_order_idx" ON "return_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "return_requests_user_idx" ON "return_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "return_requests_vendor_idx" ON "return_requests" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "return_requests_status_idx" ON "return_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "review_helpful_votes_review_idx" ON "review_helpful_votes" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_helpful_votes_user_idx" ON "review_helpful_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "review_helpful_votes_unique_idx" ON "review_helpful_votes" USING btree ("review_id","user_id");--> statement-breakpoint
CREATE INDEX "shipping_labels_order_idx" ON "shipping_labels" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "shipping_labels_vendor_idx" ON "shipping_labels" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "shipping_labels_tracking_idx" ON "shipping_labels" USING btree ("tracking_number");--> statement-breakpoint
CREATE INDEX "vendor_invitations_vendor_idx" ON "vendor_invitations" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_invitations_token_idx" ON "vendor_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "vendor_invitations_email_idx" ON "vendor_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "vendor_pages_vendor_idx" ON "vendor_pages" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_pages_slug_idx" ON "vendor_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "vendor_pages_unique_idx" ON "vendor_pages" USING btree ("vendor_id","slug");--> statement-breakpoint
CREATE INDEX "vendor_review_responses_review_idx" ON "vendor_review_responses" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "vendor_review_responses_vendor_idx" ON "vendor_review_responses" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_team_vendor_idx" ON "vendor_team_members" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_team_user_idx" ON "vendor_team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vendor_team_unique_idx" ON "vendor_team_members" USING btree ("vendor_id","user_id");--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coupons_vendor_idx" ON "coupons" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "coupons_scope_idx" ON "coupons" USING btree ("coupon_scope");