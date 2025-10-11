import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, TrendingUp, Users, DollarSign } from "lucide-react";
import { VendorCouponsManager } from "@/components/vendor/vendor-coupons-manager";
import { getVendorCoupons } from "@/lib/services/coupon-service";

export default async function VendorPromotionsPage() {
    const session = await auth();
    const t = await getTranslations("Vendor.promotions");

    if (!session || session.user.role !== "vendor") {
        redirect("/login");
    }

    const vendorId = session.user.vendor?.id || session.user.id;
    const couponsResult = await getVendorCoupons(vendorId);
    const couponsData = couponsResult.success ? couponsResult.coupons : [];

    // Calculate stats
    const activeCoupons = couponsData.filter(c => c.isActive).length;
    const totalUses = couponsData.reduce((sum, c) => sum + c.stats.totalUses, 0);
    const totalDiscount = couponsData.reduce((sum, c) => sum + Number(c.stats.totalDiscount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-univers text-gray-900">
                    {t("title", { default: "Promociones y Cupones" })}
                </h1>
                <p className="text-sm text-gray-600 font-univers mt-1">
                    {t("subtitle", { default: "Crea y gestiona cupones de descuento para atraer más clientes" })}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cupones</CardTitle>
                        <Ticket className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{couponsData.length}</div>
                        <p className="text-xs text-gray-500">{activeCoupons} activos</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usos Totales</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUses}</div>
                        <p className="text-xs text-gray-500">Cupones aplicados</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Descuento Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${totalDiscount.toLocaleString("es-MX", { maximumFractionDigits: 0 })}
                        </div>
                        <p className="text-xs text-gray-500">En descuentos dados</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. por Uso</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${totalUses > 0 ? (totalDiscount / totalUses).toFixed(0) : "0"}
                        </div>
                        <p className="text-xs text-gray-500">Descuento promedio</p>
                    </CardContent>
                </Card>
            </div>

            {/* Coupons Manager */}
            <Card>
                <CardContent className="pt-6">
                    <VendorCouponsManager vendorId={vendorId} initialCoupons={couponsData} />
                </CardContent>
            </Card>
        </div>
    );
}

