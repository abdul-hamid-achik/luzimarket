import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseProductCSV, importProductsFromCSV } from "@/lib/utils/product-csv";

/**
 * POST /api/vendor/products/import
 * Import products from CSV
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "vendor") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { csvContent } = body;

        if (!csvContent || typeof csvContent !== "string") {
            return NextResponse.json(
                { error: "CSV content is required" },
                { status: 400 }
            );
        }

        // Parse CSV
        const parseResult = parseProductCSV(csvContent);

        if (!parseResult.success || !parseResult.data) {
            return NextResponse.json(
                { error: parseResult.error || "Failed to parse CSV" },
                { status: 400 }
            );
        }

        // Limit to 500 products per import to prevent abuse
        if (parseResult.data.length > 500) {
            return NextResponse.json(
                { error: "Maximum 500 products per import. Please split your file." },
                { status: 400 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;

        // Import products
        const importResult = await importProductsFromCSV(vendorId, parseResult.data);

        return NextResponse.json({
            success: importResult.success,
            imported: importResult.imported,
            total: parseResult.data.length,
            errors: importResult.errors,
            created: importResult.created,
        });
    } catch (error) {
        console.error("Error importing products:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

