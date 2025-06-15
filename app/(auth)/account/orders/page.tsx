import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function OrdersPage() {
  const session = await auth();
  
  if (!session) {
    return null;
  }

  // Fetch user's orders
  const userOrders = await db
    .select({
      order: orders,
      items: orderItems,
      product: products,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt));

  // Group items by order
  const ordersWithItems = userOrders.reduce((acc, row) => {
    const orderId = row.order.id;
    if (!acc[orderId]) {
      acc[orderId] = {
        ...row.order,
        items: [],
      };
    }
    if (row.items && row.product) {
      acc[orderId].items.push({
        ...row.items,
        product: row.product,
      });
    }
    return acc;
  }, {} as Record<string, any>);

  const ordersList = Object.values(ordersWithItems);

  if (ordersList.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-times-now mb-2">No tienes pedidos aún</h2>
        <p className="text-gray-600 font-univers mb-6">
          Cuando realices tu primera compra, aparecerá aquí
        </p>
        <Button asChild className="bg-black text-white hover:bg-gray-800">
          <Link href="/products">
            Explorar productos
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", class: "bg-yellow-100 text-yellow-800" },
      processing: { label: "Procesando", class: "bg-blue-100 text-blue-800" },
      shipped: { label: "Enviado", class: "bg-purple-100 text-purple-800" },
      delivered: { label: "Entregado", class: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", class: "bg-red-100 text-red-800" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-univers ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-times-now">Mis pedidos</h1>
      </div>

      {ordersList.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 font-univers">
                Pedido #{order.id.slice(-8).toUpperCase()}
              </p>
              <p className="text-sm text-gray-600 font-univers">
                {new Date(order.createdAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {getStatusBadge(order.status)}
          </div>

          <div className="space-y-4 mb-4">
            {order.items.map((item: any) => {
              const productImages = item.product.images as string[];
              return (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={productImages[0] || "/images/links/pia-riverola.webp"}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-univers text-sm">{item.product.name}</h3>
                    <p className="text-sm text-gray-600 font-univers">
                      Cantidad: {item.quantity} × ${parseFloat(item.price).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <p className="font-univers">
              Total: <span className="font-medium">${parseFloat(order.total).toLocaleString('es-MX')} MXN</span>
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/account/orders/${order.id}`}>
                Ver detalles
              </Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}