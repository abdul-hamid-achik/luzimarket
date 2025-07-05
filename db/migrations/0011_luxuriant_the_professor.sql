ALTER TABLE "admin_users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "last_failed_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_failed_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "failed_login_attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "last_failed_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "locked_until" timestamp;