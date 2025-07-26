import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { db } from "@/db";
import { products, vendors, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProductsGrid } from "@/components/products/products-grid";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { SortDropdown } from "@/components/products/sort-dropdown";

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

async function getProducts(filters: any) {
  const allProducts = await db
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
    .where(eq(products.isActive, true));

  // Apply filters here (category, vendor, price range, etc.)
  let filteredProducts = allProducts;

  // Apply sorting
  if (filters.sort === 'price-asc') {
    filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (filters.sort === 'price-desc') {
    filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
  }

  return filteredProducts;
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);
  
  const t = await getTranslations('Products');
  const productList = await getProducts(filters);

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
              <FilterSidebar />
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-gray-600 font-univers">
                    {productList.length} {t('productsFound')}
                  </p>
                </div>
                
                {/* Sort Dropdown */}
                <SortDropdown />
              </div>
              
              <ProductsGrid products={productList} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}