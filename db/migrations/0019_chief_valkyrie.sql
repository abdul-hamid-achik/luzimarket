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
ALTER TABLE "products" ADD COLUMN "images_approved" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "images_pending_moderation" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product_image_moderation" ADD CONSTRAINT "product_image_moderation_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_moderation" ADD CONSTRAINT "product_image_moderation_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image_moderation" ADD CONSTRAINT "product_image_moderation_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_image_moderation_product_idx" ON "product_image_moderation" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_image_moderation_vendor_idx" ON "product_image_moderation" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "product_image_moderation_status_idx" ON "product_image_moderation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_image_moderation_created_at_idx" ON "product_image_moderation" USING btree ("created_at");