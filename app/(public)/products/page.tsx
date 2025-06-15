import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { MobileFilterDrawer } from "@/components/products/mobile-filter-drawer";
import { ProductCard } from "@/components/products/product-card";
import { getFilteredProducts, getProductFilterOptions } from "@/lib/actions/products";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProductsPageProps {
  searchParams: {
    categories?: string;
    vendors?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    page?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Parse search params
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
    getFilteredProducts(filters),
    getProductFilterOptions(),
  ]);

  const { products, pagination } = productsData;

  // Format filter options for sidebar
  const formattedCategories = filterOptions.categories.map(cat => ({
    id: cat.id.toString(),
    name: cat.name,
    count: Number(cat.count),
  }));

  const formattedVendors = filterOptions.vendors.map(vendor => ({
    id: vendor.id,
    name: vendor.name,
    count: Number(vendor.count),
  }));

  // Client component for sort dropdown
  function SortSelect({ defaultValue }: { defaultValue?: string }) {
    return (
      <form action={async (formData: FormData) => {
        "use server";
        const sortBy = formData.get("sortBy") as string;
        const params = new URLSearchParams(searchParams as any);
        params.set("sortBy", sortBy);
        redirect(`/products?${params.toString()}`);
      }}>
        <Select name="sortBy" defaultValue={defaultValue || "newest"}>
          <SelectTrigger className="w-[180px] border-0 font-univers text-sm">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Más reciente</SelectItem>
            <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
            <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
          </SelectContent>
        </Select>
        <button type="submit" className="hidden" />
      </form>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar
              categories={formattedCategories}
              vendors={formattedVendors}
              priceRange={filterOptions.priceRange}
            />
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort and Filter Options */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {/* Mobile Filter Button */}
                <MobileFilterDrawer
                  categories={formattedCategories}
                  vendors={formattedVendors}
                  priceRange={filterOptions.priceRange}
                />
                <SortSelect defaultValue={searchParams.sortBy} />
                <span className="text-sm font-univers text-gray-600">
                  {pagination.totalCount} productos
                </span>
              </div>
              <div className="text-sm font-univers text-gray-500 hidden sm:block">
                {searchParams.sortBy === "price-asc" && "Precio más bajo a más alto"}
                {searchParams.sortBy === "price-desc" && "Precio más alto a más bajo"}
              </div>
            </div>

            {/* Product Grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 font-univers">No se encontraron productos</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {pagination.hasPreviousPage && (
                  <Link
                    href={`/products?${new URLSearchParams({
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
                    href={`/products?${new URLSearchParams({
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
          </div>
        </div>
      </div>
    </div>
  );
}