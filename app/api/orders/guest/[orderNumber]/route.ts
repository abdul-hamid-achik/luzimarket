import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products, vendors } from "@/db/schema";
import { and, eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ orderNumber: string }>; 
}

// Public endpoint for guests to fetch their order details using order number + email
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const { orderNumber } = await params;

    if (!email) {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      );
    }

    // Find order by orderNumber and guest email
    const order = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        orderGroupId: orders.orderGroupId,
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
      })
      .from(orders)
      .leftJoin(vendors, eq(orders.vendorId, vendors.id))
      .where(and(eq(orders.orderNumber, orderNumber), eq(orders.guestEmail, email)))
      .limit(1);

    if (!order[0]) {
      return NextResponse.json(
        { error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const orderData = order[0];

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
        },
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderData.id));

    const orderWithItems = {
      ...orderData,
      items: items.map((item) => ({
        ...item,
        product: {
          id: item.product?.id || "",
          name: item.product?.name || "Producto eliminado",
          images: item.product?.images || [],
          slug: item.product?.slug || "",
        },
      })),
    };

    // Fetch related orders if this is part of a multi-vendor checkout
    let relatedOrders: any[] = [];
    if (orderData.orderGroupId) {
      const related = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          total: orders.total,
          trackingNumber: orders.trackingNumber,
          carrier: orders.carrier,
          vendor: {
            id: vendors.id,
            businessName: vendors.businessName,
          }
        })
        .from(orders)
        .leftJoin(vendors, eq(orders.vendorId, vendors.id))
        .where(eq(orders.orderGroupId, orderData.orderGroupId));

      // Get items count for each related order
      for (const relatedOrder of related) {
        const relatedItems = await db
          .select({
            id: orderItems.id,
            quantity: orderItems.quantity,
            product: {
              name: products.name,
            }
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, relatedOrder.id));

        relatedOrders.push({
          ...relatedOrder,
          items: relatedItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            product: {
              name: item.product?.name || 'Producto eliminado',
            }
          }))
        });
      }
    }

    return NextResponse.json({ 
      order: orderWithItems,
      relatedOrders: relatedOrders.length > 1 ? relatedOrders : []
    });
  } catch (error) {
    console.error("Error fetching guest order details:", error);
    return NextResponse.json(
      { error: "Error al obtener los detalles de la orden" },
      { status: 500 }
    );
  }
}


