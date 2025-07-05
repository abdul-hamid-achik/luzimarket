ALTER TABLE "orders" ADD COLUMN "tracking_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "carrier" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "estimated_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "actual_delivery_date" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_history" json DEFAULT '[]'::json;