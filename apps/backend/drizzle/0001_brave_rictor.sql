CREATE TABLE "article_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "article_topics_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "image_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "image_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "materials_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "product_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"size" text NOT NULL,
	CONSTRAINT "sizes_size_unique" UNIQUE("size")
);
