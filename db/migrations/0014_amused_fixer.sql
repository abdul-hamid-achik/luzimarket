CREATE TABLE "shipping_methods" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shipping_methods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"carrier" text NOT NULL,
	"service_type" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"min_delivery_days" integer NOT NULL,
	"max_delivery_days" integer NOT NULL,
	"tracking_url_pattern" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "shipping_methods_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "shipping_zones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shipping_zones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"states" json NOT NULL,
	"base_rate_multiplier" numeric(10, 2) DEFAULT '1.0' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "shipping_zones_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "vendor_shipping_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"shipping_method_id" integer NOT NULL,
	"zone_id" integer NOT NULL,
	"min_weight" integer NOT NULL,
	"max_weight" integer NOT NULL,
	"base_rate" numeric(10, 2) NOT NULL,
	"per_kg_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "length" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "width" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "height" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shipping_class" text DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "shipping_origin_state" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "free_shipping_threshold" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "default_shipping_method_id" integer;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "shipping_settings" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "vendor_shipping_rates" ADD CONSTRAINT "vendor_shipping_rates_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_shipping_rates" ADD CONSTRAINT "vendor_shipping_rates_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_shipping_rates" ADD CONSTRAINT "vendor_shipping_rates_zone_id_shipping_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vendor_shipping_rates_vendor_idx" ON "vendor_shipping_rates" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_shipping_rates_method_idx" ON "vendor_shipping_rates" USING btree ("shipping_method_id");--> statement-breakpoint
CREATE INDEX "vendor_shipping_rates_zone_idx" ON "vendor_shipping_rates" USING btree ("zone_id");--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_default_shipping_method_id_shipping_methods_id_fk" FOREIGN KEY ("default_shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Insert default shipping zones for Mexico
INSERT INTO shipping_zones (name, code, description, states, base_rate_multiplier) VALUES
('Zona Centro', 'central', 'Ciudad de México y estados centrales', 
 '["Ciudad de México", "Estado de México", "Morelos", "Puebla", "Tlaxcala", "Hidalgo"]'::json, 
 1.0),
('Zona Norte', 'north', 'Estados del norte de México', 
 '["Nuevo León", "Coahuila", "Tamaulipas", "Chihuahua", "Durango", "Zacatecas", "San Luis Potosí"]'::json, 
 1.3),
('Zona Sur', 'south', 'Estados del sur de México', 
 '["Guerrero", "Oaxaca", "Chiapas", "Veracruz", "Tabasco"]'::json, 
 1.2),
('Zona Sureste', 'southeast', 'Península de Yucatán', 
 '["Yucatán", "Quintana Roo", "Campeche"]'::json, 
 1.4),
('Zona Noroeste', 'northwest', 'Estados del noroeste y Pacífico', 
 '["Baja California", "Baja California Sur", "Sonora", "Sinaloa", "Nayarit", "Jalisco", "Colima", "Michoacán", "Guanajuato", "Aguascalientes", "Querétaro"]'::json, 
 1.35);
--> statement-breakpoint
-- Insert default shipping methods
INSERT INTO shipping_methods (carrier, service_type, name, code, description, min_delivery_days, max_delivery_days, tracking_url_pattern) VALUES
('estafeta', 'standard', 'Estafeta Terrestre', 'estafeta_ground', 'Envío terrestre económico', 3, 7, 'https://www.estafeta.com/Tracking/result?wayBillType=0&wayBill={tracking_number}'),
('estafeta', 'express', 'Estafeta Día Siguiente', 'estafeta_next_day', 'Entrega al día siguiente hábil', 1, 2, 'https://www.estafeta.com/Tracking/result?wayBillType=0&wayBill={tracking_number}'),
('dhl', 'express', 'DHL Express', 'dhl_express', 'Servicio express internacional y nacional', 1, 3, 'https://www.dhl.com/mx-es/home/tracking/tracking-parcel.html?submit=1&tracking-id={tracking_number}'),
('fedex', 'standard', 'FedEx Ground', 'fedex_ground', 'Envío terrestre confiable', 2, 5, 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}'),
('fedex', 'express', 'FedEx Express', 'fedex_express', 'Entrega rápida garantizada', 1, 2, 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}'),
('correos', 'standard', 'Correos de México', 'correos_standard', 'Servicio postal nacional', 5, 10, 'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/Tracking/Tracking.aspx?guia={tracking_number}'),
('redpack', 'standard', 'RedPack Terrestre', 'redpack_ground', 'Cobertura nacional terrestre', 3, 6, 'https://www.redpack.com.mx/es/rastreo/?guia={tracking_number}'),
('redpack', 'express', 'RedPack Express', 'redpack_express', 'Entrega express en principales ciudades', 1, 3, 'https://www.redpack.com.mx/es/rastreo/?guia={tracking_number}');