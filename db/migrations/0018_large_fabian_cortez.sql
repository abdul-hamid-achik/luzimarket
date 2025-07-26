ALTER TABLE "admin_users" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "two_factor_backup_codes" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_backup_codes" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "two_factor_backup_codes" json DEFAULT '[]'::json;