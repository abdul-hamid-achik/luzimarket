import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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

        // Mock activity data for now since we don't have an activities table
        // In a real implementation, you would fetch from an activities/audit_log table
        const mockActivities = [
            {
                id: "1",
                action: "Inicio de sesión",
                description: "Usuario accedió al sistema",
                timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
                ipAddress: "192.168.1.1"
            },
            {
                id: "2",
                action: "Actualización de perfil",
                description: "Usuario actualizó su información de perfil",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
                ipAddress: "192.168.1.1"
            },
            {
                id: "3",
                action: "Pedido realizado",
                description: "Usuario realizó un pedido (#12345)",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                ipAddress: "192.168.1.1"
            },
            {
                id: "4",
                action: "Registro de cuenta",
                description: "Usuario se registró en el sistema",
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 1 week ago
                ipAddress: "192.168.1.100"
            }
        ];

        return NextResponse.json(mockActivities);
    } catch (error) {
        console.error("Error fetching activities:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 