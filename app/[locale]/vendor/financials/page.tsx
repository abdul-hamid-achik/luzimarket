import { redirect } from "next/navigation";
import { getVendorFromSession } from "@/lib/actions/vendor";
import { getVendorBalance, getVendorTransactions, getVendorPayouts, getVendorStripeAccount } from "@/lib/actions/stripe-connect.action";
import { getTranslations } from "next-intl/server";
import { FinancialsClient } from "./financials-client";

export default async function VendorFinancialsPage() {
  const t = await getTranslations("Vendor.financials");
  
  const vendorResult = await getVendorFromSession();
  if (!vendorResult.success || !vendorResult.data) {
    redirect("/vendor/register");
  }

  const vendor = vendorResult.data;

  // Fetch all financial data in parallel
  const [balanceResult, transactionsResult, payoutsResult, stripeAccountResult] = await Promise.all([
    getVendorBalance(vendor.id),
    getVendorTransactions(vendor.id, { limit: 10 }),
    getVendorPayouts(vendor.id, { limit: 10 }),
    getVendorStripeAccount(vendor.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-times-now text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("description")}</p>
      </div>

      <FinancialsClient
        vendor={vendor}
        balance={balanceResult.success ? balanceResult.data : null}
        transactions={transactionsResult.success ? transactionsResult.data : null}
        payouts={payoutsResult.success ? payoutsResult.data : null}
        stripeAccount={stripeAccountResult.success ? stripeAccountResult.data : null}
      />
    </div>
  );
}