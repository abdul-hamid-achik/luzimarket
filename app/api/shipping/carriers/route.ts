import { NextRequest, NextResponse } from "next/server";
import { getAvailableCarriers } from "@/lib/services/shipping-service";

/**
 * GET /api/shipping/carriers
 * Get list of available shipping carriers
 */
export async function GET(request: NextRequest) {
    try {
        const result = await getAvailableCarriers();

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }

        // Add common Mexican carriers that might not be in DB
        const commonCarriers = [
            { carrier: "fedex", name: "FedEx", code: "fedex" },
            { carrier: "dhl", name: "DHL Express", code: "dhl" },
            { carrier: "ups", name: "UPS", code: "ups" },
            { carrier: "estafeta", name: "Estafeta", code: "estafeta" },
            { carrier: "correos-de-mexico", name: "Correos de México", code: "correos-de-mexico" },
            { carrier: "99minutos", name: "99 Minutos", code: "99minutos" },
            { carrier: "otro", name: "Otro", code: "other" },
        ];

        // Merge with database carriers, avoiding duplicates
        const allCarriers = [
            ...result.carriers,
            ...commonCarriers.filter(
                cc => !result.carriers.some(rc => rc.carrier === cc.carrier)
            ),
        ];

        return NextResponse.json({
            success: true,
            carriers: allCarriers,
        });
    } catch (error) {
        console.error("Error fetching carriers:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

