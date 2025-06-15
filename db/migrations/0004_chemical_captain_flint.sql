ALTER TABLE "vendors" ADD COLUMN "slug" text;--> statement-breakpoint
CREATE INDEX "vendors_slug_idx" ON "vendors" USING btree ("slug");