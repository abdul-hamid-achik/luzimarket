import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserDetails } from "@/lib/services/user-service";

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

        // Get user details using UserService
        const result = await getUserDetails(userId);

        if (!result.success) {
            return NextResponse.json({ error: result.error || "User not found" }, { status: 404 });
        }

        return NextResponse.json(result.user);
    } catch (error) {
        console.error("Error fetching user details:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
