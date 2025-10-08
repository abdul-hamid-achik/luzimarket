import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc, ilike, eq, and, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "100");
        const offset = parseInt(searchParams.get("offset") || "0");
        const category = searchParams.get("category");
        const severity = searchParams.get("severity");
        const search = searchParams.get("search");

        // Build query conditions
        const conditions = [];

        if (category && category !== "all") {
            conditions.push(eq(auditLogs.category, category));
        }

        if (severity && severity !== "all") {
            conditions.push(eq(auditLogs.severity, severity));
        }

        if (search) {
            conditions.push(
                or(
                    ilike(auditLogs.action, `%${search}%`),
                    ilike(auditLogs.userEmail, `%${search}%`),
                    ilike(auditLogs.ip, `%${search}%`)
                )
            );
        }

        // Fetch audit logs
        const logs = await db
            .select()
            .from(auditLogs)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            logs,
            pagination: {
                limit,
                offset,
                hasMore: logs.length === limit,
            },
        });
    } catch (error: any) {
        console.error("Error fetching audit logs:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
