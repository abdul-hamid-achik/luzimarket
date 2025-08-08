import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems, products, vendors, users } from "@/db/schema";
import { eq, desc, sql, ilike, and, gte, lte } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, Eye } from "lucide-react";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations('orders');

  if (!session || !session.user) {
    redirect("/login");
  }

  const search = await searchParams;
  const currentPage = parseInt(search.page || '1');
  const limit = 10;
  const offset = (currentPage - 1) * limit;
  const statusFilter = search.status || 'all';
  const searchQuery = search.search || '';

  // Build where conditions based on user role
  let whereConditions = [];

  if (session.user.role === 'customer' && session.user.id) {
    // For customers, check both userId and email
    whereConditions.push(
      sql`(${orders.userId} = ${session.user.id} OR ${orders.guestEmail} = ${session.user.email})`
    );
  } else if (session.user.email) {
    // For vendors or admins, only check by email
    whereConditions.push(eq(orders.guestEmail, session.user.email));
  }

  if (searchQuery) {
    whereConditions.push(ilike(orders.orderNumber, `%${searchQuery}%`));
  }

  if (statusFilter && statusFilter !== 'all') {
    whereConditions.push(eq(orders.status, statusFilter));
  }

  // Get orders with pagination
  const userOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      subtotal: orders.subtotal,
      tax: orders.tax,
      shipping: orders.shipping,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      createdAt: orders.createdAt,
      vendor: {
        businessName: vendors.businessName,
      }
    })
    .from(orders)
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(and(...whereConditions))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  // Get order items for each order
  const ordersWithItems = [];

  for (const order of userOrders) {
    const items = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: orderItems.total,
        product: {
          name: products.name,
          images: products.images,
          slug: products.slug,
        }
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    ordersWithItems.push({
      ...order,
      items: items.map(item => ({
        ...item,
        product: {
          name: item.product?.name || 'Producto eliminado',
          images: item.product?.images || [],
          slug: item.product?.slug || '',
        }
      }))
    });
  }

  // Get total count for pagination
  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(and(...whereConditions));

  const totalCount = totalCountResult[0]?.count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const statusConfig = {
    pending: { label: t("status.pending"), color: "bg-gray-100 text-gray-800" },
    paid: { label: t("status.paid"), color: "bg-blue-100 text-blue-800" },
    processing: { label: t("status.processing"), color: "bg-yellow-100 text-yellow-800" },
    shipped: { label: t("status.shipped"), color: "bg-purple-100 text-purple-800" },
    delivered: { label: t("status.delivered"), color: "bg-green-100 text-green-800" },
    cancelled: { label: t("status.cancelled"), color: "bg-red-100 text-red-800" },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      {ordersWithItems.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">{t('noOrders')}</p>
          <Link href="/">
            <Button className="mt-6">{t('startShopping')}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {ordersWithItems.map((order) => (
            <div key={order.id} className="border rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{t('orderNumber', { number: order.orderNumber })}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4" />
                    {order.createdAt ? new Date(order.createdAt as unknown as string).toLocaleDateString(locale) : ''}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {order.vendor?.businessName || t('unknownVendor')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={statusConfig[order.status as keyof typeof statusConfig]?.color}>
                    {statusConfig[order.status as keyof typeof statusConfig]?.label}
                  </Badge>
                  <p className="text-lg font-semibold mt-2">{formatCurrency(parseFloat(order.total))}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">{t('items')}:</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product.name} x{item.quantity}</span>
                      <span>{formatCurrency(parseFloat(item.total))}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Link href={{ pathname: '/orders/[orderNumber]', params: { orderNumber: order.orderNumber } }}>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    {t('viewDetails')}
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {currentPage > 1 && (
                <Link href={{ pathname: '/orders', query: { page: String(currentPage - 1) } }}>
                  <Button variant="outline">{t('previous')}</Button>
                </Link>
              )}
              <span className="px-4 py-2">
                {t('pageOf', { current: currentPage, total: totalPages })}
              </span>
              {currentPage < totalPages && (
                <Link href={{ pathname: '/orders', query: { page: String(currentPage + 1) } }}>
                  <Button variant="outline">{t('next')}</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}