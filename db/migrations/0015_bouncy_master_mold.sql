CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"method" text DEFAULT 'bank_transfer' NOT NULL,
	"stripe_payout_id" text,
	"bank_account_id" uuid,
	"arrival_date" timestamp,
	"failure_reason" text,
	"metadata" json DEFAULT '{}'::json,
	"transaction_ids" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"paid_at" timestamp,
	CONSTRAINT "payouts_stripe_payout_id_unique" UNIQUE("stripe_payout_id")
);
--> statement-breakpoint
CREATE TABLE "platform_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"order_amount" numeric(10, 2) NOT NULL,
	"fee_percentage" numeric(5, 2) NOT NULL,
	"fee_amount" numeric(10, 2) NOT NULL,
	"vendor_earnings" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_application_fee_id" text,
	"created_at" timestamp DEFAULT now(),
	"collected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"order_id" uuid,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"description" text,
	"metadata" json DEFAULT '{}'::json,
	"stripe_transfer_id" text,
	"stripe_charge_id" text,
	"stripe_refund_id" text,
	"balance_transaction" json,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "vendor_balances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"available_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"pending_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"reserved_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_balances_vendor_id_unique" UNIQUE("vendor_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"account_holder_name" text NOT NULL,
	"account_holder_type" text NOT NULL,
	"bank_name" text NOT NULL,
	"last4" text NOT NULL,
	"currency" text DEFAULT 'MXN' NOT NULL,
	"country" text DEFAULT 'MX' NOT NULL,
	"is_default" boolean DEFAULT false,
	"stripe_external_account_id" text,
	"metadata" json DEFAULT '{}'::json,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vendor_stripe_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"stripe_account_id" text NOT NULL,
	"account_type" text DEFAULT 'express' NOT NULL,
	"onboarding_status" text DEFAULT 'pending' NOT NULL,
	"charges_enabled" boolean DEFAULT false,
	"payouts_enabled" boolean DEFAULT false,
	"details_submitted" boolean DEFAULT false,
	"requirements" json,
	"capabilities" json,
	"business_profile" json,
	"commission_rate" numeric(5, 2) DEFAULT '15' NOT NULL,
	"payout_schedule" json DEFAULT '{"interval":"daily"}'::json,
	"minimum_payout_amount" numeric(10, 2) DEFAULT '100' NOT NULL,
	"tos_acceptance_date" timestamp,
	"tos_acceptance_ip" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_stripe_accounts_vendor_id_unique" UNIQUE("vendor_id"),
	CONSTRAINT "vendor_stripe_accounts_stripe_account_id_unique" UNIQUE("stripe_account_id")
);
--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_bank_account_id_vendor_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."vendor_bank_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fees" ADD CONSTRAINT "platform_fees_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_fees" ADD CONSTRAINT "platform_fees_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_balances" ADD CONSTRAINT "vendor_balances_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bank_accounts" ADD CONSTRAINT "vendor_bank_accounts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_stripe_accounts" ADD CONSTRAINT "vendor_stripe_accounts_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payouts_vendor_idx" ON "payouts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payouts_stripe_payout_idx" ON "payouts" USING btree ("stripe_payout_id");--> statement-breakpoint
CREATE INDEX "payouts_created_idx" ON "payouts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "platform_fees_order_idx" ON "platform_fees" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "platform_fees_vendor_idx" ON "platform_fees" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "platform_fees_status_idx" ON "platform_fees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_vendor_idx" ON "transactions" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "transactions_order_idx" ON "transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_created_idx" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "vendor_balances_vendor_idx" ON "vendor_balances" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_bank_accounts_vendor_idx" ON "vendor_bank_accounts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_bank_accounts_stripe_idx" ON "vendor_bank_accounts" USING btree ("stripe_external_account_id");--> statement-breakpoint
CREATE INDEX "vendor_stripe_accounts_vendor_idx" ON "vendor_stripe_accounts" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "vendor_stripe_accounts_stripe_idx" ON "vendor_stripe_accounts" USING btree ("stripe_account_id");--> statement-breakpoint
CREATE INDEX "vendor_stripe_accounts_status_idx" ON "vendor_stripe_accounts" USING btree ("onboarding_status");