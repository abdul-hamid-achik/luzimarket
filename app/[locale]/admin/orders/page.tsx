import { db } from "@/db";
import { orders, users, orderItems } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { AdminOrdersClient } from "./admin-orders-client";

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
  const t = await getTranslations("Admin.ordersPage");
  const tStatus = await getTranslations("Admin.orderStatus");
  const orderList = await getOrders();

  return (
    <AdminOrdersClient 
      orders={orderList}
      updateOrderStatus={updateOrderStatus}
      translations={{
        title: t("title"),
        subtitle: t("subtitle"),
        orderNumber: t("orderNumber"),
        customer: t("customer"),
        guest: t("guest"),
        total: t("total"),
        items: t("items"),
        status: t("status"),
        payment: t("payment"),
        date: t("date"),
        actions: t("actions"),
        statusPending: tStatus("pending"),
        statusPaid: tStatus("paid"),
        statusShipped: tStatus("shipped"),
        statusDelivered: tStatus("delivered"),
        statusCancelled: tStatus("cancelled"),
        paymentSucceeded: t("paymentStatus.succeeded"),
        paymentPending: t("paymentStatus.pending"),
        paymentFailed: t("paymentStatus.failed"),
        exportCSV: t("exportCSV"),
        exporting: t("exporting"),
      }}
    />
  );
}