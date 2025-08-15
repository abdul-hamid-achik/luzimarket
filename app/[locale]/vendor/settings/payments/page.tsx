import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { getVendorFromSession } from "@/lib/actions/vendor";
import { getVendorStripeAccount, createVendorOnboardingLink } from "@/lib/actions/stripe-connect.action";
import { Badge } from "@/components/ui/badge";

export default async function VendorPaymentsSettingsPage() {
    const t = await getTranslations("Vendor.payments");

    const vendorResult = await getVendorFromSession();
    if (!vendorResult.success || !vendorResult.data) {
        redirect("/vendor/register");
    }

    const vendor = vendorResult.data;
    const stripeResult = await getVendorStripeAccount(vendor.id);

    const status = stripeResult.success ? stripeResult.data : null;
    const chargesEnabled = !!status?.chargesEnabled;
    const payoutsEnabled = !!status?.payoutsEnabled;
    const detailsSubmitted = !!status?.detailsSubmitted;

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
                <CardContent className="space-y-4">
                    {status ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2">
                                {chargesEnabled ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="text-sm">
                                    {t("stripe.chargesEnabled", { default: "Cobros activados" })}
                                </span>
                                <Badge variant={chargesEnabled ? "default" : "outline"}>
                                    {chargesEnabled ? t("common.enabled", { default: "Activo" }) : t("common.disabled", { default: "Inactivo" })}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                {payoutsEnabled ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-gray-400" />
                                )}
                                <span className="text-sm">
                                    {t("stripe.payoutsEnabled", { default: "Retiros activados" })}
                                </span>
                                <Badge variant={payoutsEnabled ? "default" : "outline"}>
                                    {payoutsEnabled ? t("common.enabled", { default: "Activo" }) : t("common.disabled", { default: "Inactivo" })}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                {detailsSubmitted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                )}
                                <span className="text-sm">
                                    {t("stripe.detailsSubmitted", { default: "Cuenta verificada" })}
                                </span>
                                <Badge variant={detailsSubmitted ? "default" : "outline"}>
                                    {detailsSubmitted ? t("common.complete", { default: "Completo" }) : t("common.pending", { default: "Pendiente" })}
                                </Badge>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600">
                            {t("stripe.notConnected", { default: "Aún no has conectado tu cuenta de Stripe." })}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Link href="/vendor/stripe-onboarding">
                            <Button className="inline-flex items-center gap-2">
                                {status ? t("stripe.manage", { default: "Administrar en Stripe" }) : t("stripe.start", { default: "Comenzar configuración" })}
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


