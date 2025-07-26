import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { ProductsGrid } from "@/components/products/products-grid";
import { db } from "@/db";
import { products, vendors, categories } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

interface BestSellersPageProps {
  params: Promise<{ locale: string }>;
}

async function getBestSellers() {
  const bestSellers = await db
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
    .orderBy(desc(products.createdAt))
    .limit(20);

  return bestSellers;
}

export default async function BestSellersPage({ params }: BestSellersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('Navigation');
  const tHome = await getTranslations('HomePage');
  const productsList = await getBestSellers();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16">
        <div className="text-center px-8">
          <h1 className="text-4xl md:text-5xl font-times-now mb-4">
            {t('bestSellers')}
          </h1>
          <p className="text-base md:text-lg font-univers text-gray-600 max-w-2xl mx-auto">
            {tHome('trendingNow')}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 px-4 md:px-8">
        <ProductsGrid products={productsList} />
      </section>
    </main>
  );
}