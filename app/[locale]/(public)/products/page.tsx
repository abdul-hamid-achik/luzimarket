import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { ProductsGrid } from "@/components/products/products-grid";
import { InfiniteProductsGrid } from "@/components/products/infinite-products-grid";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { SortDropdown } from "@/components/products/sort-dropdown";
import { getFilteredProducts, getProductFilterOptions } from "@/lib/actions/products";

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    vendor?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}



export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('Products');

  // Get products using the same filtering logic as handpicked page
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

  // Execute queries in parallel for better performance
  const [productsResult, filterOptions] = await Promise.all([
    getFilteredProducts({
      categoryIds,
      vendorIds,
      sortBy: filters.sort as any,
      minPrice: filters.minPrice && !isNaN(parseInt(filters.minPrice)) ? parseInt(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice && !isNaN(parseInt(filters.maxPrice)) ? parseInt(filters.maxPrice) : undefined,
    }),
    getProductFilterOptions({
      categoryIds,
      vendorIds,
      // Note: price facet already constrained below by min/max from URL if provided
      ...(filters.minPrice && !isNaN(parseInt(filters.minPrice)) ? { minPrice: parseInt(filters.minPrice) } : {}),
      ...(filters.maxPrice && !isNaN(parseInt(filters.maxPrice)) ? { maxPrice: parseInt(filters.maxPrice) } : {}),
    })
  ]);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[300px] overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2">
          {/* Left side - gradient background */}
          <div className="relative bg-gradient-to-br from-pink-300 via-yellow-200 to-orange-300">
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="max-w-md">
                <h1 className="text-4xl font-times-now mb-4">{t('title')}</h1>
                <p className="text-base font-univers leading-relaxed">
                  {t('subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - dark background with pattern */}
          <div className="relative bg-black">
            <div className="absolute inset-0 opacity-20">
              {/* Add a pattern or image here */}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className="w-64 hidden lg:block">
              <FilterSidebar
                categories={filterOptions.categories.map((cat: any) => ({
                  id: cat.id.toString(),
                  name: cat.name,
                  count: Number(cat.count)
                }))}
                vendors={filterOptions.vendors.map((vendor: any) => ({
                  id: vendor.id,
                  name: vendor.name,
                  count: Number(vendor.count)
                }))}
                priceRange={filterOptions.priceRange}
              />
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-gray-600 font-univers">
                    {productsResult.products.length} {t('productsFound')}
                  </p>
                </div>

                {/* Sort Dropdown */}
                <SortDropdown />
              </div>

              <InfiniteProductsGrid
                initialProducts={productsResult.products as any}
                initialPagination={productsResult.pagination}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}