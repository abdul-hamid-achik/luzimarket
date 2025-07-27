import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, orderItems, products, vendors, users } from "@/db/schema";
import { eq, desc, sql, ilike, and, gte, lte } from "drizzle-orm";
import { z } from "zod";

const ordersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'all']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validationResult = ordersQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Parámetros de consulta inválidos" },
        { status: 400 }
      );
    }

    const { search, status, from, to, page, limit } = validationResult.data;
    const offset = (page - 1) * limit;
    const userId = session.user.id;

    // Build where conditions
    let whereConditions = [eq(orders.userId, userId)];

    if (search) {
      whereConditions.push(ilike(orders.orderNumber, `%${search}%`));
    }

    if (status && status !== 'all') {
      whereConditions.push(eq(orders.status, status));
    }

    if (from) {
      try {
        whereConditions.push(gte(orders.createdAt, new Date(from)));
      } catch (error) {
        return NextResponse.json(
          { error: "Fecha 'desde' inválida" },
          { status: 400 }
        );
      }
    }

    if (to) {
      try {
        whereConditions.push(lte(orders.createdAt, new Date(to)));
      } catch (error) {
        return NextResponse.json(
          { error: "Fecha 'hasta' inválida" },
          { status: 400 }
        );
      }
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

    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit,
      }
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error al obtener las órdenes" },
      { status: 500 }
    );
  }
}