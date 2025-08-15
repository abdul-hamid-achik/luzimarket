import { redirect } from "next/navigation";
import { getVendorFromSession } from "@/lib/actions/vendor";
import { getVendorStripeAccount } from "@/lib/actions/stripe-connect.action";
import { StripeOnboardingClient } from "./stripe-onboarding-client";
import { getTranslations } from "next-intl/server";

export default async function StripeOnboardingPage() {
  const t = await getTranslations("Vendor.stripeOnboarding");
  
  const vendorResult = await getVendorFromSession();
  if (!vendorResult.success || !vendorResult.data) {
    redirect("/vendor/register");
  }

  const vendor = vendorResult.data;
  const stripeAccountResult = await getVendorStripeAccount(vendor.id);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="font-times-now text-3xl mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <StripeOnboardingClient 
        vendor={vendor}
        stripeAccount={stripeAccountResult.success ? stripeAccountResult.data : null}
      />
    </div>
  );
}