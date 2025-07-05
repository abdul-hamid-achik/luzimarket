import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, orders, vendors, adminUsers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: userId } = await params;

        // Try to find the user in the regular users table first
        const customerUser = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                createdAt: users.createdAt,
                orderCount: sql<number>`(
          SELECT COUNT(*) FROM ${orders}
          WHERE ${orders.userId} = ${users.id}
        )`,
                totalSpent: sql<number>`(
          SELECT COALESCE(SUM(${orders.total}::numeric), 0) FROM ${orders}
          WHERE ${orders.userId} = ${users.id}
          AND ${orders.paymentStatus} = 'succeeded'
        )`,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (customerUser.length > 0) {
            return NextResponse.json({
                ...customerUser[0],
                userType: 'customer',
                orderCount: customerUser[0].orderCount || 0,
                totalSpent: customerUser[0].totalSpent || 0,
                phone: null,
                address: null,
                lastLoginAt: null,
            });
        }

        // Try to find the user in the vendors table
        const vendorUser = await db
            .select({
                id: vendors.id,
                name: vendors.contactName,
                email: vendors.email,
                phone: vendors.phone,
                createdAt: vendors.createdAt,
            })
            .from(vendors)
            .where(eq(vendors.id, userId))
            .limit(1);

        if (vendorUser.length > 0) {
            // Construct address from vendor address fields
            const address = [
                vendorUser[0].name, // contact name placeholder
                // Add other address components when available
            ].filter(Boolean).join(", ") || null;

            return NextResponse.json({
                ...vendorUser[0],
                userType: 'vendor',
                orderCount: 0,
                totalSpent: 0,
                address: null, // We don't have a combined address field
                lastLoginAt: null,
            });
        }

        // Try to find the user in the admin users table
        const adminUser = await db
            .select({
                id: adminUsers.id,
                name: adminUsers.name,
                email: adminUsers.email,
                createdAt: adminUsers.createdAt,
            })
            .from(adminUsers)
            .where(eq(adminUsers.id, userId))
            .limit(1);

        if (adminUser.length > 0) {
            return NextResponse.json({
                ...adminUser[0],
                userType: 'admin',
                orderCount: 0,
                totalSpent: 0,
                phone: null,
                address: null,
                lastLoginAt: null,
            });
        }

        return NextResponse.json({ error: "User not found" }, { status: 404 });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 