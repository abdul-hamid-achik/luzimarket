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
import Link from "next/link";

async function getStats() {
  const now = new Date();

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
    pendingProducts
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
    db.select({ count: sql<number>`count(*)` }).from(products).where(sql`${products.isActive} = false`)
  ]);

  const totalLockedAccounts = (lockedUsersCount[0]?.count || 0) +
    (lockedVendorsCount[0]?.count || 0) +
    (lockedAdminsCount[0]?.count || 0);

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    totalOrders: totalOrders[0]?.count || 0,
    totalProducts: totalProducts[0]?.count || 0,
    totalVendors: totalVendors[0]?.count || 0,
    totalUsers: totalUsers[0]?.count || 0,
    totalLockedAccounts,
    pendingVendors: pendingVendors[0]?.count || 0,
    pendingProducts: pendingProducts[0]?.count || 0,
    recentOrders
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statsCards = [
    {
      title: "Ingresos Totales",
      value: `$${stats.totalRevenue.toLocaleString('es-MX')}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Órdenes Totales",
      value: stats.totalOrders.toString(),
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Productos Activos",
      value: stats.totalProducts.toString(),
      change: "+3.7%",
      trend: "up",
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Vendedores Activos",
      value: stats.totalVendors.toString(),
      change: "-2.1%",
      trend: "down",
      icon: Store,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          Resumen de la actividad de tu plataforma
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;

          return (
            <div key={stat.title} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}>
                  <span>{stat.change}</span>
                  <TrendIcon className="h-4 w-4" />
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
                        ${Number(order.total).toLocaleString('es-MX')}
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