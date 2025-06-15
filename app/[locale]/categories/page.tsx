import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface CategoriesPageProps {
  params: Promise<{ locale: string }>;
}

async function getCategoriesWithProducts() {
  const categoriesWithCount = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      imageUrl: categories.imageUrl,
      productCount: sql<number>`count(${products.id})`,
    })
    .from(categories)
    .leftJoin(products, eq(categories.id, products.categoryId))
    .groupBy(categories.id)
    .orderBy(categories.name);

  return categoriesWithCount;
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('Navigation');
  const categoryList = await getCategoriesWithProducts();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16">
        <div className="text-center px-8">
          <h1 className="text-4xl md:text-5xl font-times-now mb-4">
            {t('categories')}
          </h1>
          <p className="text-base md:text-lg font-univers text-gray-600 max-w-2xl mx-auto">
            {t('categories')}
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categoryList.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-times-now text-gray-300">
                      {category.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-colors" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <h3 className="text-xl font-univers mb-2">{category.name}</h3>
                  <span className="text-sm font-univers opacity-90">
                    {category.productCount} {category.productCount === 1 ? 'producto' : 'productos'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}