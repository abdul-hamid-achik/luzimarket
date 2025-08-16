import { NextResponse } from "next/server";
import { getFilteredProducts } from "@/lib/actions/products";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    try {
        const sort = searchParams.get("sort") || undefined;
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");

        // Accept both single and multi filters
        const category = searchParams.get("category");
        const categoriesParam = searchParams.get("categories");
        const vendor = searchParams.get("vendor");
        const vendorsParam = searchParams.get("vendors");
        const tagsParam = searchParams.get("tags");
        const productIdsParam = searchParams.get("productIds");

        const categoryIds = category
            ? [category]
            : categoriesParam
                ? categoriesParam.split(",").filter(Boolean)
                : undefined;

        const vendorIds = vendor
            ? [vendor]
            : vendorsParam
                ? vendorsParam.split(",").filter(Boolean)
                : undefined;

        const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;

        const result = await getFilteredProducts({
            productIds: productIdsParam ? productIdsParam.split(",").filter(Boolean) : undefined,
            categoryIds,
            vendorIds,
            tags,
            sortBy: sort as any,
            minPrice: minPrice ? parseInt(minPrice, 10) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice, 10) : undefined,
            page,
            limit,
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("/api/products error:", error);
        // Graceful fallback when DB is unreachable during tests/local dev
        return NextResponse.json({
            products: [],
            pagination: {
                page,
                limit,
                totalCount: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        });
    }
}


