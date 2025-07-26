import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products, orders, vendors, vendorStripeAccounts } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { 
  Package, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Plus,
  ArrowUpRight,
  CreditCard,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

async function getVendorStats(vendorId: string) {
  const [
    totalProducts,
    activeProducts,
    totalOrders,
    totalRevenue,
    recentOrders
  ] = await Promise.all([
    // Total products
    db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.vendorId, vendorId)),
    
    // Active products
    db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(
        eq(products.vendorId, vendorId),
        eq(products.isActive, true)
      )),
    
    // Total orders
    db.select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.vendorId, vendorId)),
    
    // Total revenue
    db.select({ 
      total: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)` 
    })
      .from(orders)
      .where(and(
        eq(orders.vendorId, vendorId),
        eq(orders.paymentStatus, 'succeeded')
      )),
    
    // Recent orders
    db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.vendorId, vendorId))
    .orderBy(sql`${orders.createdAt} DESC`)
    .limit(5)
  ]);

  return {
    totalProducts: totalProducts[0]?.count || 0,
    activeProducts: activeProducts[0]?.count || 0,
    totalOrders: totalOrders[0]?.count || 0,
    totalRevenue: totalRevenue[0]?.total || 0,
    recentOrders
  };
}

export default async function VendorDashboard() {
  const session = await auth();
  const t = await getTranslations("vendor");
  
  if (!session || session.user.role !== "vendor") {
    redirect("/login");
  }

  const vendorId = session.user.id;
  const stats = await getVendorStats(vendorId);

  // Get vendor info and Stripe account
  const [vendorInfo] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, vendorId))
    .limit(1);

  const [stripeAccount] = await db
    .select()
    .from(vendorStripeAccounts)
    .where(eq(vendorStripeAccounts.vendorId, vendorId))
    .limit(1);

  const statsCards = [
    {
      title: t("dashboard.totalProducts"),
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: t("dashboard.activeProducts"),
      value: stats.activeProducts.toString(),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: t("dashboard.totalOrders"),
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: t("dashboard.totalRevenue"),
      value: `$${stats.totalRevenue.toLocaleString('es-MX')}`,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-univers text-gray-900">
            {t("dashboard.welcome", { businessName: vendorInfo.businessName })}
          </h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Link href="/vendor/products/new">
          <Button className="bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            {t("dashboard.addProduct")}
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <div key={stat.title} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <h3 className="text-sm font-univers text-gray-600 mb-1">{stat.title}</h3>
              <p className="text-2xl font-univers font-semibold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-univers text-gray-900 mb-4">{t("dashboard.quickActions")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/vendor/products">
              <Button variant="outline" className="w-full">
                {t("dashboard.viewProducts")}
              </Button>
            </Link>
            <Link href="/vendor/orders">
              <Button variant="outline" className="w-full">
                {t("dashboard.viewOrders")}
              </Button>
            </Link>
            <Link href="/vendor/analytics">
              <Button variant="outline" className="w-full">
                {t("dashboard.analytics")}
              </Button>
            </Link>
            <Link href="/vendor/settings">
              <Button variant="outline" className="w-full">
                {t("dashboard.settings")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-univers text-gray-900">{t("dashboard.recentOrders")}</h2>
            <Link href="/vendor/orders" className="text-sm text-blue-600 hover:text-blue-800 font-univers">
              {t("dashboard.viewAll")}
            </Link>
          </div>
          
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 font-univers text-center py-8">
              {t("dashboard.noRecentOrders")}
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-univers font-medium text-gray-900">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500 font-univers">
                      {new Date(order.createdAt!).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-univers ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'paid' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status === 'delivered' ? t("dashboard.orderStatus.delivered") :
                       order.status === 'shipped' ? t("dashboard.orderStatus.shipped") :
                       order.status === 'paid' ? t("dashboard.orderStatus.paid") :
                       t("dashboard.orderStatus.pending")}
                    </span>
                    <p className="text-sm font-univers font-medium text-gray-900">
                      ${Number(order.total).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account status */}
      {!vendorInfo.isActive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-univers">
            {t("dashboard.accountPending")}
          </p>
        </div>
      )}

      {/* Stripe Connect status */}
      {vendorInfo.isActive && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-univers text-gray-900">{t("dashboard.stripeConnect.title")}</h2>
                <p className="text-sm text-gray-600 font-univers">{t("dashboard.stripeConnect.description")}</p>
              </div>
            </div>
            {stripeAccount && (
              <Badge className={stripeAccount.chargesEnabled && stripeAccount.payoutsEnabled ? "bg-green-600" : "bg-yellow-600"}>
                {stripeAccount.chargesEnabled && stripeAccount.payoutsEnabled ? t("dashboard.stripeConnect.active") : t("dashboard.stripeConnect.pending")}
              </Badge>
            )}
          </div>

          {!stripeAccount ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("dashboard.stripeConnect.notConnected")}
              </AlertDescription>
            </Alert>
          ) : !stripeAccount.chargesEnabled || !stripeAccount.payoutsEnabled ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("dashboard.stripeConnect.incompleteSetup")}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {t("dashboard.stripeConnect.fullyActive")}
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4">
            <Link href="/vendor/stripe-onboarding">
              <Button className="w-full" variant={stripeAccount?.chargesEnabled ? "outline" : "default"}>
                <CreditCard className="h-4 w-4 mr-2" />
                {!stripeAccount ? t("dashboard.stripeConnect.setupPayments") : 
                 stripeAccount.chargesEnabled && stripeAccount.payoutsEnabled ? t("dashboard.stripeConnect.managePayments") : 
                 t("dashboard.stripeConnect.completeSetup")}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}