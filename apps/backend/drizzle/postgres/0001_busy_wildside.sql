ALTER TABLE "delivery_zones" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD COLUMN "description" text;