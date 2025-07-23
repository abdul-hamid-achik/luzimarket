ALTER TABLE "platform_fees" ADD COLUMN "stripe_transfer_id" text;--> statement-breakpoint
ALTER TABLE "platform_fees" ADD COLUMN "transferred_at" timestamp;