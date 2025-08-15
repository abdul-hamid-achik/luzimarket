ALTER TABLE "vendors" DROP CONSTRAINT "vendors_default_shipping_method_id_shipping_methods_id_fk";
--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_default_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("default_shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE set null ON UPDATE no action;