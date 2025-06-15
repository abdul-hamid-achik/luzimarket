import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { db } from "@/db";
import { products, vendors, categories } from "@/db/schema";
import { eq, ilike, or, and } from "drizzle-orm";
import { ProductsGrid } from "@/components/products/products-grid";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ 
    q?: string;
    category?: string;
    vendor?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

async function searchProducts(query: string, filters: any) {
  if (!query) {
    return [];
  }

  const searchResults = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      images: products.images,
      stock: products.stock,
      vendor: {
        id: vendors.id,
        businessName: vendors.businessName,
      },
      category: {
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      },
    })
    .from(products)
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.isActive, true),
        or(
          ilike(products.name, `%${query}%`),
          ilike(products.description, `%${query}%`),
          ilike(vendors.businessName, `%${query}%`),
          ilike(categories.name, `%${query}%`)
        )
      )
    );

  // Apply sorting
  if (filters.sort === 'price-asc') {
    searchResults.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (filters.sort === 'price-desc') {
    searchResults.sort((a, b) => Number(b.price) - Number(a.price));
  }

  return searchResults;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const { q: query, ...filters } = await searchParams;
  setRequestLocale(locale);
  
  const t = await getTranslations('Search');
  const searchResults = query ? await searchProducts(query, filters) : [];

  return (
    <main className="min-h-screen bg-white">
      {/* Search Header */}
      <section className="bg-gray-50 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Search className="h-6 w-6 text-gray-600" />
              <h1 className="text-2xl font-times-now">Resultados de búsqueda</h1>
            </div>
            
            {query && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <p className="text-gray-600 font-univers">
                  Búsqueda para: <span className="font-medium text-black">&quot;{query}&quot;</span>
                </p>
                <Link href="/search">
                  <Button variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            {query && (
              <p className="text-sm text-gray-600 font-univers">
                {searchResults.length} producto{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Search Results */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {!query ? (
            // No search query
            <div className="text-center py-16">
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h2 className="text-2xl font-times-now text-gray-900 mb-4">
                ¿Qué estás buscando?
              </h2>
              <p className="text-gray-600 font-univers mb-8 max-w-md mx-auto">
                Utiliza la barra de búsqueda para encontrar productos, marcas o categorías
              </p>
              <div className="space-y-4">
                <p className="text-sm font-univers text-gray-500">Búsquedas populares:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['flores', 'chocolates', 'regalos', 'eventos', 'personalizado'].map((term) => (
                    <Link key={term} href={`/search?q=${term}`}>
                      <Button variant="outline" size="sm" className="font-univers">
                        {term}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            // No results
            <div className="text-center py-16">
              <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-times-now text-gray-900 mb-4">
                No se encontraron resultados
              </h2>
              <p className="text-gray-600 font-univers mb-8 max-w-md mx-auto">
                No pudimos encontrar productos que coincidan con tu búsqueda. 
                Intenta con diferentes términos o explora nuestras categorías.
              </p>
              <div className="space-y-4">
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/products">
                    <Button className="bg-black text-white hover:bg-gray-800">
                      Ver todos los productos
                    </Button>
                  </Link>
                  <Link href="/categories">
                    <Button variant="outline">
                      Explorar categorías
                    </Button>
                  </Link>
                </div>
                
                <div className="pt-8">
                  <p className="text-sm font-univers text-gray-500 mb-3">Sugerencias:</p>
                  <ul className="text-sm text-gray-600 font-univers space-y-1 max-w-sm mx-auto">
                    <li>• Verifica la ortografía</li>
                    <li>• Usa términos más generales</li>
                    <li>• Prueba con sinónimos</li>
                    <li>• Busca por categoría o marca</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            // Results found
            <div className="flex gap-8">
              {/* Filters Sidebar */}
              <aside className="w-64 hidden lg:block">
                <FilterSidebar />
              </aside>

              {/* Products Grid */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-times-now mb-1">
                      Resultados para &quot;{query}&quot;
                    </h2>
                    <p className="text-sm text-gray-600 font-univers">
                      {searchResults.length} producto{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  {/* Sort Dropdown - would be implemented with Select component */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-univers text-gray-600">Ordenar por</span>
                    <select className="text-sm border border-gray-300 rounded px-3 py-1 font-univers">
                      <option value="relevance">Relevancia</option>
                      <option value="price-asc">Precio: menor a mayor</option>
                      <option value="price-desc">Precio: mayor a menor</option>
                      <option value="newest">Más reciente</option>
                    </select>
                  </div>
                </div>
                
                <ProductsGrid products={searchResults} />

                {/* Load more or pagination could go here */}
                {searchResults.length >= 20 && (
                  <div className="text-center mt-12">
                    <Button variant="outline" className="font-univers">
                      Cargar más resultados
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}