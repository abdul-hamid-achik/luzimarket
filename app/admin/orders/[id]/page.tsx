import { db } from "@/db";
import { orders, orderItems, products, users, vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { revalidatePath } from "next/cache";

async function updateOrderStatus(orderId: string, status: string) {
  "use server";
  
  await db
    .update(orders)
    .set({ status: status as any })
    .where(eq(orders.id, orderId));
  
  revalidatePath(`/admin/orders/${orderId}`);
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Admin.ordersPage");

  // Fetch order with user and vendor info
  const orderData = await db
    .select({
      order: orders,
      user: users,
      vendor: vendors,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!orderData.length) {
    notFound();
  }

  const { order, user, vendor } = orderData[0];

  // Fetch order items
  const items = await db
    .select({
      orderItem: orderItems,
      product: products,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const shippingAddress = order.shippingAddress as any;
  const billingAddress = order.billingAddress as any;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-univers text-gray-900">
            {t("orderDetails")} #{order.orderNumber}
          </h1>
          <p className="text-sm text-gray-600 font-univers mt-1">
            {new Date(order.createdAt!).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Link href="/admin/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToOrders")}
          </Button>
        </Link>
      </div>

      {/* Order Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{t("status")}</h2>
        <div className="flex items-center space-x-4">
          <OrderStatusSelect
            orderId={order.id}
            currentStatus={order.status}
            statusColors={statusColors}
            onStatusChange={updateOrderStatus}
          />
          {order.trackingNumber && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{t("trackingNumber")}:</span> {order.trackingNumber}
            </div>
          )}
        </div>
        {order.notes && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{t("notes")}:</span> {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">{t("customer")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="mt-1 text-sm text-gray-900">
              {user?.name || order.guestEmail || t("guest")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="mt-1 text-sm text-gray-900">
              {user?.email || order.guestEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {t("shippingAddress")}
          </h2>
          {shippingAddress && (
            <div className="text-sm text-gray-600 space-y-1">
              <p>{shippingAddress.name}</p>
              <p>{shippingAddress.street}</p>
              <p>
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
              </p>
              <p>{shippingAddress.country}</p>
              <p className="pt-2">{shippingAddress.phone}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {t("billingAddress")}
          </h2>
          {billingAddress && (
            <div className="text-sm text-gray-600 space-y-1">
              <p>{billingAddress.name}</p>
              <p>{billingAddress.street}</p>
              <p>
                {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
              </p>
              <p>{billingAddress.country}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{t("orderItems")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("product")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("quantity")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("price")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("total")}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map(({ orderItem, product }) => (
                <tr key={orderItem.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product?.images?.[0] && (
                        <div className="relative h-10 w-10 mr-3">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {product?.name || "Unknown Product"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {orderItem.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${Number(orderItem.price).toLocaleString("es-MX")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${(Number(orderItem.price) * orderItem.quantity).toLocaleString("es-MX")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("subtotal")}</span>
              <span className="text-gray-900">
                ${Number(order.subtotal).toLocaleString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("tax")}</span>
              <span className="text-gray-900">
                ${Number(order.tax).toLocaleString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("shipping")}</span>
              <span className="text-gray-900">
                ${Number(order.shipping).toLocaleString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between text-base font-medium pt-2 border-t">
              <span className="text-gray-900">{t("total")}</span>
              <span className="text-gray-900">
                ${Number(order.total).toLocaleString("es-MX")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Information */}
      {vendor && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Vendor Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Business Name</p>
              <p className="mt-1 text-sm text-gray-900">{vendor.businessName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Contact</p>
              <p className="mt-1 text-sm text-gray-900">{vendor.contactName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 text-sm text-gray-900">{vendor.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="mt-1 text-sm text-gray-900">{vendor.phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}