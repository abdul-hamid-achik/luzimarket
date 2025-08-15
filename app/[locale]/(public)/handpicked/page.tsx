import { Suspense } from "react";
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { ProductsGrid } from "@/components/products/products-grid";
import { InfiniteProductsGrid } from "@/components/products/infinite-products-grid";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { SortDropdown } from "@/components/products/sort-dropdown";
import { getFilteredProducts, getProductFilterOptions } from "@/lib/actions/products";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { eq } from "drizzle-orm";

interface HandpickedPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    vendor?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function HandpickedPage({ params, searchParams }: HandpickedPageProps) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('HandpickedPage');

  // Get products with handpicked tag
  const categoryIds = filters.category
    ? [filters.category]
    : (typeof (filters as any).categories === 'string' && (filters as any).categories.length > 0
      ? (filters as any).categories.split(',')
      : undefined);
  const vendorIds = filters.vendor
    ? [filters.vendor]
    : (typeof (filters as any).vendors === 'string' && (filters as any).vendors.length > 0
      ? (filters as any).vendors.split(',')
      : undefined);

  let productsResult = await getFilteredProducts({
    categoryIds,
    vendorIds,
    sortBy: filters.sort as any,
    minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
    tags: ['handpicked'], // Filter for handpicked products
  });

  // Fallback: if no handpicked products, show general products so the page is never empty
  const usingFallback = productsResult.products.length === 0;
  if (usingFallback) {
    productsResult = await getFilteredProducts({
      categoryIds,
      vendorIds,
      sortBy: filters.sort as any,
      minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
    });
  }

  const filterOptions = await getProductFilterOptions({
    categoryIds,
    vendorIds,
    ...(filters.minPrice ? { minPrice: parseInt(filters.minPrice) } : {}),
    ...(filters.maxPrice ? { maxPrice: parseInt(filters.maxPrice) } : {}),
  });
  const vendorsList = filterOptions.vendors.map((v: any) => ({ id: v.id, businessName: v.name, count: Number(v.count) }));
  const hasSearchParams = Object.values(filters || {}).some((v) => v !== undefined && v !== null && v !== "");

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-times-now mb-6">
            <span className="relative inline-block">
              {t('title')}
              <svg
                className="absolute inset-0 w-full h-full -z-10 scale-110"
                viewBox="0 0 400 120"
                preserveAspectRatio="none"
              >
                <ellipse
                  cx="200"
                  cy="60"
                  rx="185"
                  ry="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-gray-700"
                />
              </svg>
            </span>
          </h1>
          <p className="text-lg md:text-xl font-univers text-gray-600 max-w-3xl mx-auto">
            {t('description')}
          </p>
        </div>
      </section>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h2 className="text-lg font-univers font-medium mb-6">{t('filterBy')}</h2>
              <FilterSidebar
                categories={filterOptions.categories.map((cat: any) => ({
                  id: cat.id.toString(),
                  name: cat.name,
                  count: Number(cat.count)
                }))}
                vendors={vendorsList.map((vendor: any) => ({
                  id: vendor.id,
                  name: vendor.businessName,
                  count: Number(vendor.count || 0)
                }))}
                priceRange={filterOptions.priceRange}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort and Results */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="text-sm font-univers text-gray-600">
                {hasSearchParams && productsResult.pagination.totalCount > 0 && (
                  <p>
                    {t('resultsCount', {
                      count: productsResult.pagination.totalCount,
                      defaultValue: `${productsResult.pagination.totalCount} ${productsResult.pagination.totalCount === 1 ? 'producto encontrado' : 'productos encontrados'}`
                    })}
                  </p>
                )}
              </div>
              <SortDropdown />
            </div>

            {/* Products */}
            {productsResult.products.length > 0 ? (
              <Suspense fallback={<ProductGridSkeleton />}>
                <InfiniteProductsGrid
                  initialProducts={productsResult.products as any}
                  initialPagination={productsResult.pagination}
                  staticFilters={usingFallback ? undefined : { tags: ['handpicked'] }}
                />
              </Suspense>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 font-univers">{t('noProducts')}</p>
                <p className="text-sm text-gray-400 mt-2">{t('tryAdjustingFilters')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}