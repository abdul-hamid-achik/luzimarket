import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems, products, vendors, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { orderNumber } = await params;
    const userId = session.user.id;

    // Get order details
    const order = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        subtotal: orders.subtotal,
        tax: orders.tax,
        shipping: orders.shipping,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        paymentIntentId: orders.paymentIntentId,
        trackingNumber: orders.trackingNumber,
        carrier: orders.carrier,
        estimatedDeliveryDate: orders.estimatedDeliveryDate,
        actualDeliveryDate: orders.actualDeliveryDate,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        notes: orders.notes,
        userId: orders.userId,
        guestEmail: orders.guestEmail,
        guestName: orders.guestName,
        guestPhone: orders.guestPhone,
        vendor: {
          id: vendors.id,
          businessName: vendors.businessName,
          email: vendors.email,
          phone: vendors.phone,
        },
        user: {
          name: users.name,
          email: users.email,
        }
      })
      .from(orders)
      .leftJoin(vendors, eq(orders.vendorId, vendors.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(
        and(
          eq(orders.orderNumber, orderNumber),
          eq(orders.userId, userId)
        )
      )
      .limit(1);

    if (!order[0]) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const orderData = order[0];

    // Get order items
    const items = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        price: orderItems.price,
        total: orderItems.total,
        product: {
          id: products.id,
          name: products.name,
          images: products.images,
          slug: products.slug,
        }
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderData.id));

    const orderWithItems = {
      ...orderData,
      items: items.map(item => ({
        ...item,
        product: {
          id: item.product?.id || '',
          name: item.product?.name || 'Producto eliminado',
          images: item.product?.images || [],
          slug: item.product?.slug || '',
        }
      }))
    };

    return NextResponse.json({ order: orderWithItems });

  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Error al obtener los detalles de la orden" },
      { status: 500 }
    );
  }
}