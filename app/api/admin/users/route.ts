import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, orders, vendors, adminUsers } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
    try {
        const session = await auth();

        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all users with their order statistics
        const customerUsers = await db
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
            .orderBy(desc(users.createdAt));

        // Get all vendors
        const vendorUsers = await db
            .select({
                id: vendors.id,
                name: vendors.contactName,
                email: vendors.email,
                createdAt: vendors.createdAt,
            })
            .from(vendors)
            .orderBy(desc(vendors.createdAt));

        // Get all admin users
        const adminUsersList = await db
            .select({
                id: adminUsers.id,
                name: adminUsers.name,
                email: adminUsers.email,
                createdAt: adminUsers.createdAt,
            })
            .from(adminUsers)
            .orderBy(desc(adminUsers.createdAt));

        // Combine all users with their types
        const allUsers = [
            ...customerUsers.map(user => ({
                ...user,
                userType: 'customer' as const,
                orderCount: user.orderCount || 0,
                totalSpent: user.totalSpent || 0,
            })),
            ...vendorUsers.map(user => ({
                ...user,
                userType: 'vendor' as const,
                orderCount: 0,
                totalSpent: 0,
            })),
            ...adminUsersList.map(user => ({
                ...user,
                userType: 'admin' as const,
                orderCount: 0,
                totalSpent: 0,
            })),
        ];

        // Sort by creation date (newest first)
        allUsers.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return NextResponse.json(allUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 