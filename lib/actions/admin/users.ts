"use server";

import { db } from "@/db";
import { users, orders, vendors, adminUsers } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date | null;
  orderCount: number;
  totalSpent: number;
  userType: "customer" | "vendor" | "admin";
  lockedUntil?: Date | null;
};

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  // Customers with order stats
  const customerUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      lockedUntil: users.lockedUntil,
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

  // Vendors
  const vendorUsers = await db
    .select({
      id: vendors.id,
      name: vendors.contactName,
      email: vendors.email,
      createdAt: vendors.createdAt,
      lockedUntil: vendors.lockedUntil,
    })
    .from(vendors)
    .orderBy(desc(vendors.createdAt));

  // Admins
  const adminUsersList = await db
    .select({
      id: adminUsers.id,
      name: adminUsers.name,
      email: adminUsers.email,
      createdAt: adminUsers.createdAt,
      lockedUntil: adminUsers.lockedUntil,
    })
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt));

  const all: AdminUserRow[] = [
    ...customerUsers.map((u) => ({
      ...u,
      userType: "customer" as const,
      orderCount: Number((u as any).orderCount || 0),
      totalSpent: Number((u as any).totalSpent || 0),
    })),
    ...vendorUsers.map((u) => ({
      ...u,
      userType: "vendor" as const,
      orderCount: 0,
      totalSpent: 0,
    })),
    ...adminUsersList.map((u) => ({
      ...u,
      userType: "admin" as const,
      orderCount: 0,
      totalSpent: 0,
    })),
  ];

  // Newest first
  all.sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dbt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dbt - da;
  });

  return all;
}
