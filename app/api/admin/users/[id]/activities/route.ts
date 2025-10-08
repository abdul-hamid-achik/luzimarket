import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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

        // Fetch real audit logs for this user
        const activities = await db
            .select({
                id: auditLogs.id,
                action: auditLogs.action,
                category: auditLogs.category,
                severity: auditLogs.severity,
                details: auditLogs.details,
                ip: auditLogs.ip,
                method: auditLogs.method,
                path: auditLogs.path,
                statusCode: auditLogs.statusCode,
                resourceType: auditLogs.resourceType,
                resourceId: auditLogs.resourceId,
                errorMessage: auditLogs.errorMessage,
                createdAt: auditLogs.createdAt,
            })
            .from(auditLogs)
            .where(eq(auditLogs.userId, userId))
            .orderBy(desc(auditLogs.createdAt))
            .limit(50);

        // Format for frontend
        const formattedActivities = activities.map(activity => ({
            id: activity.id,
            action: activity.action,
            description: `${activity.action} - ${activity.category}`,
            timestamp: activity.createdAt,
            ipAddress: activity.ip,
            method: activity.method,
            path: activity.path,
            status: activity.statusCode,
            severity: activity.severity,
            details: activity.details,
            error: activity.errorMessage,
        }));

        return NextResponse.json(formattedActivities);
    } catch (error) {
        console.error("Error fetching activities:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 