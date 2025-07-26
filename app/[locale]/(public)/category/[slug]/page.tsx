import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { products, categories, vendors } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ProductsGrid } from "@/components/products/products-grid";
import { FilterSidebar } from "@/components/products/filter-sidebar";
import { Button } from "@/components/ui/button";

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function getCategoryWithProducts(slug: string) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (!category) {
    return null;
  }

  const categoryProducts = await db
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
        eq(products.categoryId, category.id),
        eq(products.isActive, true)
      )
    );

  return { category, products: categoryProducts };
}

// Map slugs to display names and descriptions
const categoryInfo: Record<string, { title: string; subtitle: string; heroImage: string; gradient: string }> = {
  'flores-arreglos': {
    title: 'Flores & Amores',
    subtitle: 'Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Nulla vitae elit libero, a pharetra augue. Sed posuere consectetur est at lobortis.',
    heroImage: '/images/links/pia-riverola.webp',
    gradient: 'bg-gradient-to-br from-luzi-pink via-luzi-coral to-luzi-yellow'
  },
  'chocolates-dulces': {
    title: 'Dulces & Chocolates',
    subtitle: 'Delicias artesanales y chocolates premium para endulzar momentos especiales.',
    heroImage: '/images/links/game-wwe-19-1507733870-150-911.jpg',
    gradient: 'bg-gradient-to-br from-luzi-pink-light via-luzi-pink to-luzi-coral'
  },
  'eventos-cenas': {
    title: 'Eventos & Cenas',
    subtitle: 'Todo lo que necesitas para crear experiencias memorables.',
    heroImage: '/images/links/placeholder-1.webp',
    gradient: 'bg-gradient-to-br from-white via-luzi-yellow-light to-luzi-yellow'
  },
  'regalos-personalizados': {
    title: 'Regalos Personalizados',
    subtitle: 'Regalos únicos y personalizados que cuentan historias.',
    heroImage: '/images/links/placeholder-2.jpg',
    gradient: 'bg-gradient-to-br from-luzi-yellow-light via-luzi-yellow to-luzi-coral'
  }
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('Common');
  const categoryData = await getCategoryWithProducts(slug);

  if (!categoryData) {
    notFound();
  }

  const info = categoryInfo[slug] || {
    title: categoryData.category.name,
    subtitle: 'Descubre nuestra selección de productos',
    heroImage: categoryData.category.imageUrl || '/images/links/placeholder-1.webp',
    gradient: 'bg-gradient-to-br from-luzi-pink via-luzi-pink-light to-luzi-yellow'
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-2">
          {/* Left side - gradient background */}
          <div className={`relative ${info.gradient}`}>
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="max-w-md">
                <h1 className="text-5xl font-times-now mb-6">{info.title}</h1>
                <p className="text-base font-univers mb-8 leading-relaxed">
                  {info.subtitle}
                </p>
                <Link href={`/${locale}/category/${slug}/flowershop`}>
                  <Button className="bg-white text-black hover:bg-gray-100 px-8">
                    Flowershop
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right side - hero image */}
          <div className="relative bg-black">
            <Image
              src={info.heroImage}
              alt={info.title}
              fill
              className="object-cover opacity-90"
            />
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
                <h2 className="text-2xl font-times-now">Handpicked</h2>
                <Link href="#" className="text-sm font-univers hover:underline">
                  Ver todos
                </Link>
              </div>
              
              <ProductsGrid products={categoryData.products} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}