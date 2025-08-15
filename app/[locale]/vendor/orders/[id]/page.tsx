import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems, products, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { VendorOrderDetailClient } from "./vendor-order-detail-client";

async function getOrderDetails(orderId: string, vendorId: string) {
  // Get order with validation that it belongs to the vendor
  const [orderData] = await db
    .select({
      order: orders,
      user: users,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(and(
      eq(orders.id, orderId),
      eq(orders.vendorId, vendorId)
    ))
    .limit(1);

  if (!orderData) {
    return null;
  }

  // Get order items
  const items = await db
    .select({
      orderItem: orderItems,
      product: products,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  return {
    ...orderData,
    items,
  };
}

export default async function VendorOrderDetailPage({
  params
}: {
  params: Promise<{ id: string; locale: string }>
}) {
  const { id, locale } = await params;
  const session = await auth();
  const t = await getTranslations("Vendor.orderDetails");
  
  if (!session || session.user.role !== "vendor") {
    redirect("/vendor/login");
  }

  const orderDetails = await getOrderDetails(id, session.user.id);
  
  if (!orderDetails) {
    notFound();
  }

  return (
    <VendorOrderDetailClient 
      order={orderDetails}
      translations={{
        orderNumber: t("orderNumber"),
        orderInvoice: t("orderInvoice"),
        date: t("date"),
        status: t("status"),
        customer: t("customer"),
        guest: t("guest"),
        shippingAddress: t("shippingAddress"),
        orderItems: t("orderItems"),
        product: t("product"),
        quantity: t("quantity"),
        price: t("price"),
        total: t("total"),
        subtotal: t("subtotal"),
        tax: t("tax"),
        shipping: t("shipping"),
        print: t("print"),
        downloadInvoice: t("downloadInvoice"),
        shippingActions: t("shippingActions"),
        paymentInfo: t("paymentInfo"),
        method: t("method"),
        paid: t("paid"),
        pending: t("pending"),
        transactionId: t("transactionId"),
        notes: t("notes"),
        copiedToClipboard: t("copiedToClipboard"),
        orderNumberCopied: t("orderNumberCopied"),
        statusPending: t("status.pending"),
        statusProcessing: t("status.processing"),
        statusShipped: t("status.shipped"),
        statusDelivered: t("status.delivered"),
        statusCancelled: t("status.cancelled"),
      }}
    />
  );
}