import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import Image from "next/image";
import Link from "next/link";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const categories = [
  {
    title: "Flowershop",
    image: "/images/links/pia-riverola.webp",
    slug: "flores-arreglos"
  },
  {
    title: "Sweet",
    image: "/images/links/game-wwe-19-1507733870-150-911.jpg",
    slug: "chocolates-dulces"
  },
  {
    title: "Events + Dinners",
    image: "/images/links/game-wwe-19-1507733870-150-911.jpg",
    slug: "eventos-cenas"
  },
  {
    title: "Giftshop",
    image: "/images/links/pia-riverola.webp",
    slug: "regalos-personalizados"
  }
];

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('HomePage');

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-times-now mb-6 leading-tight">
          Regalos handpicked extraordinarios
        </h1>
        <p className="text-lg font-univers text-gray-600 max-w-2xl mx-auto">
          Experiencias y productos seleccionados a mano para momentos especiales.
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </section>

      {/* Categories Grid */}
      <section className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="relative aspect-square group overflow-hidden"
            >
              <Image
                src={category.image}
                alt={category.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
              
              {/* Category title */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <h3 className="text-black text-sm font-univers tracking-wider bg-white px-6 py-2 inline-block">
                  {category.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Additional sections can be added here */}
    </main>
  );
}