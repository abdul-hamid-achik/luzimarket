import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

async function getVendorAnalytics(vendorId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const previousThirtyDays = new Date(thirtyDaysAgo);
  previousThirtyDays.setDate(previousThirtyDays.getDate() - 30);

  // Current period stats
  const [currentStats] = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
      totalOrders: sql<number>`COUNT(DISTINCT ${orders.id})`,
      totalItems: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      uniqueCustomers: sql<number>`COUNT(DISTINCT COALESCE(${orders.userId}::text, ${orders.guestEmail}))`,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(and(
      eq(orders.vendorId, vendorId),
      eq(orders.paymentStatus, 'succeeded'),
      gte(orders.createdAt, thirtyDaysAgo)
    ));

  // Previous period stats for comparison
  const [previousStats] = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
      totalOrders: sql<number>`COUNT(DISTINCT ${orders.id})`,
    })
    .from(orders)
    .where(and(
      eq(orders.vendorId, vendorId),
      eq(orders.paymentStatus, 'succeeded'),
      gte(orders.createdAt, previousThirtyDays),
      lte(orders.createdAt, thirtyDaysAgo)
    ));

  // Top selling products
  const topProducts = await db
    .select({
      productId: orderItems.productId,
      productName: products.name,
      productSlug: products.slug,
      totalSold: sql<number>`SUM(${orderItems.quantity})`,
      revenue: sql<number>`SUM(${orderItems.quantity} * ${orderItems.price}::numeric)`,
    })
    .from(orderItems)
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(and(
      eq(orders.vendorId, vendorId),
      eq(orders.paymentStatus, 'succeeded'),
      gte(orders.createdAt, thirtyDaysAgo)
    ))
    .groupBy(orderItems.productId, products.name, products.slug)
    .orderBy(desc(sql`SUM(${orderItems.quantity})`))
    .limit(5);

  // Recent orders
  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
      itemCount: sql<number>`(
        SELECT COUNT(*) FROM ${orderItems}
        WHERE ${orderItems.orderId} = ${orders.id}
      )`,
    })
    .from(orders)
    .where(and(
      eq(orders.vendorId, vendorId),
      eq(orders.paymentStatus, 'succeeded')
    ))
    .orderBy(desc(orders.createdAt))
    .limit(10);

  // Calculate changes
  const revenueChange = previousStats.totalRevenue > 0 
    ? ((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
    : 0;
  
  const ordersChange = previousStats.totalOrders > 0
    ? ((currentStats.totalOrders - previousStats.totalOrders) / previousStats.totalOrders) * 100
    : 0;

  const averageOrderValue = currentStats.totalOrders > 0
    ? currentStats.totalRevenue / currentStats.totalOrders
    : 0;

  return {
    currentStats,
    previousStats,
    topProducts,
    recentOrders,
    revenueChange,
    ordersChange,
    averageOrderValue,
  };
}

export default async function VendorAnalyticsPage() {
  const session = await auth();
  const t = await getTranslations("vendor.analytics");
  
  if (!session || session.user.role !== "vendor") {
    redirect("/login");
  }

  const analytics = await getVendorAnalytics(session.user.id);

  const statsCards = [
    {
      title: t("totalRevenue"),
      value: `$${analytics.currentStats.totalRevenue.toLocaleString('es-MX')}`,
      change: analytics.revenueChange,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: t("totalOrders"),
      value: analytics.currentStats.totalOrders.toString(),
      change: analytics.ordersChange,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: t("averageOrder"),
      value: `$${analytics.averageOrderValue.toFixed(2)}`,
      change: 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: t("uniqueCustomers"),
      value: analytics.currentStats.uniqueCustomers.toString(),
      change: 0,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold font-univers">{t("title")}</h1>
        <p className="text-gray-600 mt-1">{t("description")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.change >= 0 ? ArrowUpRight : ArrowDownRight;
          
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  {stat.change !== 0 && (
                    <div className={`flex items-center gap-1 text-sm ${
                      stat.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      <span>{stat.change > 0 ? "+" : ""}{stat.change.toFixed(1)}%</span>
                      <TrendIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                <p className="text-2xl font-semibold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
          <TabsTrigger value="products">{t("products")}</TabsTrigger>
          <TabsTrigger value="orders">{t("recentOrders")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("salesOverview")}</CardTitle>
              <CardDescription>{t("last30Days")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <Calendar className="h-8 w-8 mr-2" />
                <span>{t("chartComingSoon")}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("topSellingProducts")}</CardTitle>
              <CardDescription>{t("last30Days")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topProducts.map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 w-6">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {product.productName || t("deletedProduct")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t("unitsSold", { count: product.totalSold })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${Number(product.revenue).toLocaleString('es-MX')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  <p>{t("noProductsSold")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("recentOrders")}</CardTitle>
              <CardDescription>{t("latestSuccessfulOrders")}</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          #{order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt!).toLocaleDateString('es-MX')} - {order.itemCount} {t("items")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${Number(order.total).toLocaleString('es-MX')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
                  <p>{t("noOrders")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}