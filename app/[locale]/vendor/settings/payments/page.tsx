import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink } from "lucide-react";

export default async function VendorPaymentsSettingsPage() {
    const t = await getTranslations("Vendor.payments");

    // For now, this page is a bridge to the Stripe onboarding/settings flow
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-univers text-gray-900">{t("title", { default: "Pagos" })}</h1>
                <p className="text-sm text-gray-600 font-univers mt-1">
                    {t("description", { default: "Administra tu método de cobro y estado de Stripe Connect" })}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-50 p-2 rounded-lg">
                            <CreditCard className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <CardTitle>{t("stripe.title", { default: "Stripe Connect" })}</CardTitle>
                            <CardDescription>
                                {t("stripe.description", { default: "Configura o revisa tu cuenta de Stripe para recibir pagos." })}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Link href="/vendor/stripe-onboarding">
                        <Button className="inline-flex items-center gap-2">
                            {t("stripe.manage", { default: "Administrar en Stripe" })}
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}


