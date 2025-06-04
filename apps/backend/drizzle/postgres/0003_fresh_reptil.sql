CREATE TABLE "delivery_zone_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_zone_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"open_time" text NOT NULL,
	"close_time" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_zone_special_hours" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_zone_id" text NOT NULL,
	"date" text NOT NULL,
	"open_time" text,
	"close_time" text,
	"is_closed" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"category" text NOT NULL,
	"action_required" boolean DEFAULT false NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"user_id" text,
	"related_entity_id" text,
	"related_entity_type" text,
	"data" json,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "delivery_zone_schedules" ADD CONSTRAINT "delivery_zone_schedules_delivery_zone_id_delivery_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_zone_special_hours" ADD CONSTRAINT "delivery_zone_special_hours_delivery_zone_id_delivery_zones_id_fk" FOREIGN KEY ("delivery_zone_id") REFERENCES "public"."delivery_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;