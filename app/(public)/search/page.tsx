import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { MobileFilterDrawer } from "@/components/products/mobile-filter-drawer";
import { getFilteredProducts, getProductFilterOptions } from "@/lib/actions/products";
import { db } from "@/db";
import { products } from "@/db/schema";
import { or, like, eq } from "drizzle-orm";

interface SearchPageProps {
  searchParams: {
    q?: string;
    categories?: string;
    vendors?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    page?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || "";
  
  if (!query) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-univers mb-4">Ingresa un término de búsqueda</h1>
          <p className="text-gray-600 font-univers">Usa la barra de búsqueda para encontrar productos</p>
        </div>
      </div>
    );
  }

  // Search for products matching the query
  const searchConditions = [
    eq(products.isActive, true),
    or(
      like(products.name, `%${query}%`),
      like(products.description, `%${query}%`)
    )
  ];

  // Get matching product IDs
  const matchingProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(or(...searchConditions));

  const productIds = matchingProducts.map(p => p.id);

  // Parse other filters
  const filters = {
    categoryIds: searchParams.categories?.split(",").filter(Boolean),
    vendorIds: searchParams.vendors?.split(",").filter(Boolean),
    minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
    sortBy: searchParams.sortBy as any,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  };

  // Fetch products and filter options
  const [productsData, filterOptions] = await Promise.all([
    getFilteredProducts({
      ...filters,
      // Only search within products that match the search query
      productIds: productIds.length > 0 ? productIds : ["no-match"],
    }),
    getProductFilterOptions(),
  ]);

  const { products: searchResults, pagination } = productsData;

  // Format filter options
  const formattedCategories = filterOptions.categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    count: Number(cat.count),
  }));

  const formattedVendors = filterOptions.vendors.map(vendor => ({
    id: vendor.id,
    name: vendor.name,
    count: Number(vendor.count),
  }));

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-univers mb-2">
            Resultados de búsqueda para "{query}"
          </h1>
          <p className="text-sm font-univers text-gray-600">
            {pagination.totalCount} {pagination.totalCount === 1 ? "producto encontrado" : "productos encontrados"}
          </p>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar
              categories={formattedCategories}
              vendors={formattedVendors}
              priceRange={filterOptions.priceRange}
            />
          </aside>

          {/* Search Results */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <MobileFilterDrawer
                categories={formattedCategories}
                vendors={formattedVendors}
                priceRange={filterOptions.priceRange}
              />
            </div>
            
            {searchResults.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((product) => (
                    <Link key={product.id} href={`/products/${product.id}`} className="group">
                      <div className="relative aspect-square mb-4 overflow-hidden bg-gray-100">
                        <Image
                          src={product.images[0] || "/images/links/pia-riverola.webp"}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={(e) => {
                            e.preventDefault();
                            // TODO: Add to wishlist
                          }}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-univers text-sm">{product.name}</h3>
                        {product.vendor && (
                          <p className="text-xs text-gray-600 font-univers">+ {product.vendor.businessName}</p>
                        )}
                        <p className="font-univers">${product.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {pagination.hasPreviousPage && (
                      <Link
                        href={`/search?${new URLSearchParams({
                          ...searchParams,
                          page: String(pagination.page - 1),
                        }).toString()}`}
                      >
                        <Button variant="outline" size="sm">
                          Anterior
                        </Button>
                      </Link>
                    )}
                    
                    <span className="flex items-center px-4 text-sm font-univers">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    
                    {pagination.hasNextPage && (
                      <Link
                        href={`/search?${new URLSearchParams({
                          ...searchParams,
                          page: String(pagination.page + 1),
                        }).toString()}`}
                      >
                        <Button variant="outline" size="sm">
                          Siguiente
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-univers mb-4">No se encontraron productos</h2>
                <p className="text-gray-600 font-univers mb-8">
                  Intenta con otros términos de búsqueda o explora nuestras categorías
                </p>
                <Link href="/products">
                  <Button>Ver todos los productos</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}