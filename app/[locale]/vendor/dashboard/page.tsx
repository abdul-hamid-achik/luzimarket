import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products, orders, vendors } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { 
  Package, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp,
  Plus,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
  
  if (!session || session.user.role !== "vendor") {
    redirect("/login");
  }

  const vendorId = session.user.id;
  const stats = await getVendorStats(vendorId);

  // Get vendor info
  const [vendorInfo] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, vendorId))
    .limit(1);

  const statsCards = [
    {
      title: "Productos Totales",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Productos Activos",
      value: stats.activeProducts.toString(),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Órdenes Totales",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Ingresos Totales",
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
            Bienvenido, {vendorInfo.businessName}
          </h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            Aquí está el resumen de tu negocio
          </p>
        </div>
        <Link href="/vendor/products/new">
          <Button className="bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
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
          <h2 className="text-lg font-univers text-gray-900 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/vendor/products">
              <Button variant="outline" className="w-full">
                Ver Productos
              </Button>
            </Link>
            <Link href="/vendor/orders">
              <Button variant="outline" className="w-full">
                Ver Órdenes
              </Button>
            </Link>
            <Link href="/vendor/analytics">
              <Button variant="outline" className="w-full">
                Análisis
              </Button>
            </Link>
            <Link href="/vendor/settings">
              <Button variant="outline" className="w-full">
                Configuración
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-univers text-gray-900">Órdenes Recientes</h2>
            <Link href="/vendor/orders" className="text-sm text-blue-600 hover:text-blue-800 font-univers">
              Ver todas
            </Link>
          </div>
          
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500 font-univers text-center py-8">
              No hay órdenes recientes
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
                      {order.status === 'delivered' ? 'Entregado' :
                       order.status === 'shipped' ? 'Enviado' :
                       order.status === 'paid' ? 'Pagado' :
                       'Pendiente'}
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
            Tu cuenta está pendiente de aprobación. Podrás agregar productos una vez que sea aprobada.
          </p>
        </div>
      )}
    </div>
  );
}