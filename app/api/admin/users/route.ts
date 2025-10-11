export const runtime = 'nodejs';
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listUsers } from "@/lib/services/user-service";

export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session || session.user?.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // List users using UserService
        const result = await listUsers({
            search: searchParams.get("search") || undefined,
            userType: (searchParams.get("userType") as any) || 'all',
            status: (searchParams.get("status") as any) || 'all',
            page: parseInt(searchParams.get("page") || "1"),
            limit: parseInt(searchParams.get("limit") || "20"),
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json(result.users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 