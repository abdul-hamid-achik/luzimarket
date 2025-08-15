"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductsGrid } from "@/components/products/products-grid";
import { Loader2 } from "lucide-react";

type VendorInfo = {
    id: string;
    businessName: string;
} | null;

type CategoryInfo = {
    id: number;
    name: string;
    slug: string;
} | null;

export interface InfiniteProductItem {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    images: string[];
    tags: string[];
    stock: number;
    isActive: boolean;
    category: CategoryInfo;
    vendor: VendorInfo;
}

interface PaginationInfo {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface InfiniteProductsGridProps {
    initialProducts: InfiniteProductItem[];
    initialPagination: PaginationInfo;
    staticFilters?: {
        tags?: string[];
        productIds?: string[];
    };
}

export function InfiniteProductsGrid({
    initialProducts,
    initialPagination,
    staticFilters,
}: InfiniteProductsGridProps) {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<InfiniteProductItem[]>(initialProducts);
    const [page, setPage] = useState<number>(initialPagination.page);
    const [hasNextPage, setHasNextPage] = useState<boolean>(initialPagination.hasNextPage);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Build base query string from current URL params
    const baseQuery = useMemo(() => {
        const params = new URLSearchParams(searchParams.toString());
        // Ensure we do not carry a stale page number; we control page here
        params.delete("page");
        if (staticFilters?.tags && staticFilters.tags.length > 0) {
            params.set("tags", staticFilters.tags.join(","));
        }
        if (staticFilters?.productIds && staticFilters.productIds.length > 0) {
            params.set("productIds", staticFilters.productIds.join(","));
        }
        return params;
    }, [searchParams, staticFilters?.tags?.join(","), staticFilters?.productIds?.join(",")]);

    // Reset list when server-provided results or filters change
    useEffect(() => {
        setProducts(initialProducts);
        setPage(initialPagination.page);
        setHasNextPage(initialPagination.hasNextPage);
    }, [initialProducts, initialPagination.page, initialPagination.hasNextPage, baseQuery.toString()]);

    useEffect(() => {
        // IntersectionObserver to trigger loading next page
        if (!sentinelRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting) {
                    void loadMore();
                }
            },
            { rootMargin: "800px 0px" }
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sentinelRef.current, hasNextPage, baseQuery.toString()]);

    async function loadMore() {
        if (isLoading || !hasNextPage) return;
        setIsLoading(true);
        try {
            const nextPage = page + 1;
            const params = new URLSearchParams(baseQuery.toString());
            params.set("page", String(nextPage));
            params.set("limit", String(initialPagination.limit || 12));

            const res = await fetch(`/api/products?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch more products");
            const data: { products: InfiniteProductItem[]; pagination: PaginationInfo } = await res.json();

            setProducts((prev) => [...prev, ...data.products]);
            setPage(data.pagination.page);
            setHasNextPage(data.pagination.hasNextPage);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div>
            <ProductsGrid products={products as any} />

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} />

            {/* Loading indicator */}
            {isLoading && (
                <div className="py-8 flex items-center justify-center gap-3 text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-univers">Cargando…</span>
                </div>
            )}
        </div>
    );
}


