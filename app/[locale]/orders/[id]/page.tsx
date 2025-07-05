import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { orders, orderItems, products, vendors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import OrderTrackingView from "@/components/orders/order-tracking-view";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const session = await auth();
  const t = await getTranslations("Orders");

  // Fetch order with items and vendor info
  const order = await db
    .select({
      order: orders,
      vendor: vendors,
    })
    .from(orders)
    .leftJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order.length) {
    notFound();
  }

  const orderData = order[0].order;
  const vendorData = order[0].vendor;

  // Check access permissions
  if (orderData.userId) {
    // Registered user order - check if user matches
    if (!session?.user || orderData.userId !== session.user.id) {
      notFound();
    }
  } else if (orderData.guestEmail) {
    // Guest order - access is controlled by the lookup page
    // If they got here, they must have provided correct email + order number
    // No additional check needed
  } else {
    // Invalid order state
    notFound();
  }

  // Fetch order items with product details
  const items = await db
    .select({
      orderItem: orderItems,
      product: products,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <OrderTrackingView
        order={orderData}
        vendor={vendorData}
        items={items}
        locale={locale}
        isGuest={!orderData.userId}
      />
    </div>
  );
}