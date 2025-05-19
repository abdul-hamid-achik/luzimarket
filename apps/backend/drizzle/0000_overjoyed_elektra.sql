CREATE TABLE "article_topics" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "article_topics_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	CONSTRAINT "article_topics_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "brands_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"website" text NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "bundle_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bundle_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"bundle_id" integer,
	"variant_id" integer,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bundles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bundles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "cart_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"session_id" integer,
	"variant_id" integer,
	"quantity" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "delivery_zones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"fee" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editorial_articles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "editorial_articles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "editorial_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "empleados" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "empleados_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"nombre" text NOT NULL,
	"puesto" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "empleados_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "favorites_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"variant_id" integer
);
--> statement-breakpoint
CREATE TABLE "image_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "image_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	CONSTRAINT "image_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "materials_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	CONSTRAINT "materials_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "occasions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "occasions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "occasions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "order_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"order_id" integer,
	"variant_id" integer,
	"quantity" integer NOT NULL,
	"price_at_purchase" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"total" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "petitions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "petitions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "photos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"product_id" integer
);
--> statement-breakpoint
CREATE TABLE "product_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	CONSTRAINT "product_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_variants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer,
	"sku" text NOT NULL,
	"attributes" json NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"category_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"is_guest" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sizes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sizes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"size" text NOT NULL,
	CONSTRAINT "sizes_size_unique" UNIQUE("size")
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "states_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"label" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "states_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;