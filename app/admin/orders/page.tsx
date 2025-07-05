import { db } from "@/db";
import { orders, users, orderItems, products } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OrderStatusSelect } from "@/components/admin/order-status-select";

async function getOrders() {
  const orderList = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      shippingAddress: orders.shippingAddress,
      createdAt: orders.createdAt,
      userName: users.name,
      userEmail: users.email,
      itemCount: sql<number>`(
        SELECT COUNT(*) FROM ${orderItems}
        WHERE ${orderItems.orderId} = ${orders.id}
      )`,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));

  return orderList;
}

async function updateOrderStatus(orderId: string, status: string) {
  "use server";
  
  await db
    .update(orders)
    .set({ status: status as any })
    .where(eq(orders.id, orderId));
  
  revalidatePath("/admin/orders");
}

export default async function AdminOrdersPage() {
  const orderList = await getOrders();

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };


  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-univers text-gray-900">Órdenes</h1>
        <p className="text-sm text-gray-600 font-univers mt-1">
          Administra todas las órdenes de la plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries({
          pending: "Pendientes",
          paid: "Pagadas",
          shipped: "Enviadas",
          delivered: "Entregadas",
          cancelled: "Canceladas",
        }).map(([status, label]) => {
          const count = orderList.filter(o => o.status === status).length;
          return (
            <div key={status} className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm font-univers text-gray-600">{label}</p>
              <p className="text-2xl font-univers font-semibold text-gray-900">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Artículos
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-univers font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orderList.map((order) => {
                return (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-univers font-medium text-gray-900">
                        #{order.orderNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-univers text-gray-900">
                          {order.userName || 'Invitado'}
                        </div>
                        <div className="text-xs text-gray-500 font-univers">
                          {order.userEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-univers font-medium text-gray-900">
                        ${Number(order.total).toLocaleString('es-MX')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-univers">
                        {order.itemCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <OrderStatusSelect
                        orderId={order.id}
                        currentStatus={order.status}
                        statusColors={statusColors}
                        onStatusChange={updateOrderStatus}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-univers ${
                        order.paymentStatus === 'succeeded' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus === 'succeeded' ? t('paymentStatus.succeeded') :
                         order.paymentStatus === 'pending' ? t('paymentStatus.pending') :
                         t('paymentStatus.failed')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-univers">
                        {new Date(order.createdAt!).toLocaleDateString('es-MX')}
                      </div>
                      <div className="text-xs text-gray-500 font-univers">
                        {new Date(order.createdAt!).toLocaleTimeString('es-MX')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}