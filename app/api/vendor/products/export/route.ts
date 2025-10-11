import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { productsToCSV } from "@/lib/utils/product-csv";

/**
 * GET /api/vendor/products/export
 * Export vendor's products as CSV
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== "vendor") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const vendorId = session.user.vendor?.id || session.user.id;

        // Get all vendor products with category names
        const vendorProducts = await db
            .select({
                id: products.id,
                name: products.name,
                description: products.description,
                price: products.price,
                stock: products.stock,
                tags: products.tags,
                brand: products.brand,
                colors: products.colors,
                sizes: products.sizes,
                materials: products.materials,
                weight: products.weight,
                isActive: products.isActive,
                categoryName: categories.name,
            })
            .from(products)
            .leftJoin(categories, eq(products.categoryId, categories.id))
            .where(eq(products.vendorId, vendorId));

        // Convert to CSV
        const csv = productsToCSV(vendorProducts);

        // Return as downloadable file
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="products-${new Date().toISOString().split("T")[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Error exporting products:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

