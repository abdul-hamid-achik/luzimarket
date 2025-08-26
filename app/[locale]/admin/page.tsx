import { db } from "@/db";
import { orders, products, vendors, users, adminUsers } from "@/db/schema";
import { sql, and, gt } from "drizzle-orm";
import {
  TrendingUp,
  Package,
  Store,
  Users,
  DollarSign,
  ShoppingCart,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Lock
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

async function getStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalRevenue,
    totalOrders,
    totalProducts,
    totalVendors,
    totalUsers,
    recentOrders,
    lockedUsersCount,
    lockedVendorsCount,
    lockedAdminsCount,
    pendingVendors,
    pendingProducts,
    // Historical data for comparisons (last 30 days vs previous 30 days)
    revenueLastMonth,
    revenuePreviousMonth,
    ordersLastMonth,
    ordersPreviousMonth,
    productsLastMonth,
    vendorsLastMonth
  ] = await Promise.all([
    // Total revenue
    db.select({
      total: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`
    }).from(orders).where(sql`${orders.paymentStatus} = 'succeeded'`),

    // Total orders
    db.select({ count: sql<number>`count(*)` }).from(orders),

    // Total active products
    db.select({ count: sql<number>`count(*)` }).from(products).where(sql`${products.isActive} = true`),

    // Total active vendors
    db.select({ count: sql<number>`count(*)` }).from(vendors).where(sql`${vendors.isActive} = true`),

    // Total users
    db.select({ count: sql<number>`count(*)` }).from(users),

    // Recent orders
    db.select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
    })
      .from(orders)
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(5),

    // Locked accounts
    db.select({ count: sql<number>`count(*)` }).from(users)
      .where(and(
        gt(users.lockedUntil, now),
        gt(users.failedLoginAttempts, 0)
      )),
    db.select({ count: sql<number>`count(*)` }).from(vendors)
      .where(and(
        gt(vendors.lockedUntil, now),
        gt(vendors.failedLoginAttempts, 0)
      )),
    db.select({ count: sql<number>`count(*)` }).from(adminUsers)
      .where(and(
        gt(adminUsers.lockedUntil, now),
        gt(adminUsers.failedLoginAttempts, 0)
      )),

    // Pending vendors
    db.select({ count: sql<number>`count(*)` }).from(vendors).where(sql`${vendors.isActive} = false`),

    // Pending products
    db.select({ count: sql<number>`count(*)` }).from(products).where(sql`${products.isActive} = false`),

    // Historical data - Revenue last 30 days
    db.select({
      total: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`
    }).from(orders).where(and(
      sql`${orders.paymentStatus} = 'succeeded'`,
      sql`${orders.createdAt} >= ${thirtyDaysAgo.toISOString()}`
    )),

    // Historical data - Revenue previous 30 days (30-60 days ago)
    db.select({
      total: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`
    }).from(orders).where(and(
      sql`${orders.paymentStatus} = 'succeeded'`,
      sql`${orders.createdAt} >= ${sixtyDaysAgo.toISOString()}`,
      sql`${orders.createdAt} < ${thirtyDaysAgo.toISOString()}`
    )),

    // Orders last 30 days
    db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(sql`${orders.createdAt} >= ${thirtyDaysAgo.toISOString()}`),

    // Orders previous 30 days
    db.select({ count: sql<number>`count(*)` }).from(orders)
      .where(and(
        sql`${orders.createdAt} >= ${sixtyDaysAgo.toISOString()}`,
        sql`${orders.createdAt} < ${thirtyDaysAgo.toISOString()}`
      )),

    // Products created last 30 days
    db.select({ count: sql<number>`count(*)` }).from(products)
      .where(and(
        sql`${products.isActive} = true`,
        sql`${products.createdAt} >= ${thirtyDaysAgo.toISOString()}`
      )),

    // Vendors created last 30 days
    db.select({ count: sql<number>`count(*)` }).from(vendors)
      .where(and(
        sql`${vendors.isActive} = true`,
        sql`${vendors.createdAt} >= ${thirtyDaysAgo.toISOString()}`
      ))
  ]);

  const totalLockedAccounts = (lockedUsersCount[0]?.count || 0) +
    (lockedVendorsCount[0]?.count || 0) +
    (lockedAdminsCount[0]?.count || 0);

  // Calculate percentage changes
  const revenueChange = calculatePercentageChange(
    revenuePreviousMonth[0]?.total || 0,
    revenueLastMonth[0]?.total || 0
  );

  const ordersChange = calculatePercentageChange(
    ordersPreviousMonth[0]?.count || 0,
    ordersLastMonth[0]?.count || 0
  );

  const productsChange = productsLastMonth[0]?.count || 0;
  const vendorsChange = vendorsLastMonth[0]?.count || 0;

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    totalOrders: totalOrders[0]?.count || 0,
    totalProducts: totalProducts[0]?.count || 0,
    totalVendors: totalVendors[0]?.count || 0,
    totalUsers: totalUsers[0]?.count || 0,
    totalLockedAccounts,
    pendingVendors: pendingVendors[0]?.count || 0,
    pendingProducts: pendingProducts[0]?.count || 0,
    recentOrders,
    // Calculated changes
    revenueChange,
    ordersChange,
    productsChange,
    vendorsChange
  };
}

function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

function formatNumber(num: number, maxDecimals: number = 2): string {
  // Round to max decimals first
  const rounded = Math.round(num * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);

  // If it's a whole number, return without decimals
  if (rounded % 1 === 0) {
    return rounded.toString();
  }

  // Otherwise, return with up to maxDecimals decimal places, removing trailing zeros
  return rounded.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

function formatCurrency(amount: number): string {
  // For currency, always show whole numbers if no cents, otherwise show 2 decimals
  if (amount % 1 === 0) {
    return `$${amount.toLocaleString('es-MX')}`;
  }
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getStatCardStyle(change: number, isNewItems: boolean = false) {
  if (isNewItems) {
    // For new products/vendors, any new additions are positive
    if (change > 0) {
      return {
        trend: "up" as const,
        color: "text-green-600",
        bgColor: "bg-green-50",
        changeText: `+${change} nuevo${change !== 1 ? 's' : ''}`
      };
    } else {
      return {
        trend: "neutral" as const,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        changeText: "Sin cambios"
      };
    }
  }

  // For revenue and orders, show percentage changes
  if (change > 0) {
    return {
      trend: "up" as const,
      color: "text-green-600",
      bgColor: "bg-green-50",
      changeText: `+${formatNumber(change)}%`
    };
  } else if (change < 0) {
    return {
      trend: "down" as const,
      color: "text-red-600",
      bgColor: "bg-red-50",
      changeText: `${formatNumber(change)}%`
    };
  } else {
    return {
      trend: "neutral" as const,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      changeText: "Sin cambios"
    };
  }
}

export default async function AdminDashboard() {
  const t = await getTranslations("Admin");
  const stats = await getStats();

  const revenueStyle = getStatCardStyle(stats.revenueChange);
  const ordersStyle = getStatCardStyle(stats.ordersChange);
  const productsStyle = getStatCardStyle(stats.productsChange, true);
  const vendorsStyle = getStatCardStyle(stats.vendorsChange, true);

  const statsCards = [
    {
      title: t("totalRevenue"),
      value: formatCurrency(stats.totalRevenue),
      change: revenueStyle.changeText,
      trend: revenueStyle.trend,
      icon: DollarSign,
      color: revenueStyle.color,
      bgColor: revenueStyle.bgColor
    },
    {
      title: t("totalOrders"),
      value: stats.totalOrders.toString(),
      change: ordersStyle.changeText,
      trend: ordersStyle.trend,
      icon: ShoppingCart,
      color: ordersStyle.color,
      bgColor: ordersStyle.bgColor
    },
    {
      title: t("activeProducts"),
      value: stats.totalProducts.toString(),
      change: productsStyle.changeText,
      trend: productsStyle.trend,
      icon: Package,
      color: productsStyle.color,
      bgColor: productsStyle.bgColor
    },
    {
      title: t("activeVendors"),
      value: stats.totalVendors.toString(),
      change: vendorsStyle.changeText,
      trend: vendorsStyle.trend,
      icon: Store,
      color: vendorsStyle.color,
      bgColor: vendorsStyle.bgColor
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">{t("dashboard")}</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          {t("dashboardSubtitle")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUpRight :
            stat.trend === "down" ? ArrowDownRight : null;

          return (
            <div key={stat.title} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-green-600" :
                  stat.trend === "down" ? "text-red-600" :
                    "text-gray-600"
                  }`}>
                  <span>{stat.change}</span>
                  {TrendIcon && <TrendIcon className="h-4 w-4" />}
                </div>
              </div>
              <h3 className="text-sm font-univers text-gray-600 mb-1">{stat.title}</h3>
              <p className="text-2xl font-univers font-semibold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Pending items requiring attention */}
      <div>
        <h2 className="text-lg font-univers text-gray-900 mb-4">Elementos Pendientes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/vendors" className="stat-card bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers text-gray-600">Vendedores pendientes</p>
                <p className="text-2xl font-univers font-semibold text-yellow-600">{stats.pendingVendors}</p>
                <p className="text-xs text-gray-500 font-univers mt-1">Solicitudes de vendedor</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Store className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Link>

          <Link href="/admin/products" className="stat-card bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers text-gray-600">Productos pendientes</p>
                <p className="text-2xl font-univers font-semibold text-blue-600">{stats.pendingProducts}</p>
                <p className="text-xs text-gray-500 font-univers mt-1">Productos para revisar</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Link>

          <div className="stat-card bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-univers text-gray-600">Imágenes pendientes</p>
                <p className="text-2xl font-univers font-semibold text-purple-600">0</p>
                <p className="text-xs text-gray-500 font-univers mt-1">Imágenes para moderar</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-univers text-gray-900">Órdenes Recientes</h2>
          </div>
          <div className="p-6">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500 font-univers text-center py-8">
                No hay órdenes recientes
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-univers font-medium text-gray-900">
                        Orden #{order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-500 font-univers">
                        {new Date(order.createdAt!).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-univers font-medium text-gray-900">
                        {formatCurrency(Number(order.total))}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-univers ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'paid' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {order.status === 'delivered' ? 'Entregado' :
                          order.status === 'shipped' ? 'Enviado' :
                            order.status === 'paid' ? 'Pagado' :
                              order.status === 'cancelled' ? 'Cancelado' :
                                'Pendiente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-univers text-gray-900">Resumen Rápido</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-univers text-gray-600">Usuarios Totales</span>
              </div>
              <span className="text-sm font-univers font-medium text-gray-900">
                {stats.totalUsers}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-univers text-gray-600">Órdenes Este Mes</span>
              </div>
              <span className="text-sm font-univers font-medium text-gray-900">
                {Math.floor(stats.totalOrders * 0.3)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-univers text-gray-600">Tasa de Conversión</span>
              </div>
              <span className="text-sm font-univers font-medium text-gray-900">
                3.2%
              </span>
            </div>
            <Link href="/admin/locked-accounts" className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-univers text-gray-600">Cuentas Bloqueadas</span>
              </div>
              <span className={`text-sm font-univers font-medium ${stats.totalLockedAccounts > 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                {stats.totalLockedAccounts}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}