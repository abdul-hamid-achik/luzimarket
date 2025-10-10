import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { approveRefund, rejectRefund } from "@/lib/services/refund-service";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * Handle vendor approval/rejection of customer cancellation requests
 */
export async function PUT(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'vendor') {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const { id: orderId } = await params;
        const body = await request.json();
        const { action, notes } = body;

        if (!action || !['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: "Acción inválida. Usa 'approve' o 'reject'" },
                { status: 400 }
            );
        }

        let result;
        if (action === 'approve') {
            result = await approveRefund(
                orderId,
                session.user.id,
                notes
            );
        } else {
            result = await rejectRefund(
                orderId,
                session.user.id,
                notes || 'Rechazado por el vendedor'
            );
        }

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error("Error processing cancellation request:", error);
        return NextResponse.json(
            { error: "Error al procesar la solicitud" },
            { status: 500 }
        );
    }
}

