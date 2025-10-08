CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"category" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"user_id" uuid,
	"user_type" text,
	"user_email" text,
	"ip" text NOT NULL,
	"user_agent" text,
	"method" text,
	"path" text,
	"status_code" text,
	"resource_type" text,
	"resource_id" text,
	"details" json DEFAULT '{}'::json,
	"metadata" json DEFAULT '{}'::json,
	"error_message" text,
	"error_stack" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_category_idx" ON "audit_logs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");