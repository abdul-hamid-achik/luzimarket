import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroBanner } from "@/components/categories/hero-banner";
import { getFilteredProducts } from "@/lib/actions/products";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

// Map of category slugs to their display information
const categoryInfo: Record<string, { title: string; description: string; gradientFrom: string; gradientTo: string; image?: string }> = {
  "flores-amores": {
    title: "Flores & Amores",
    description: "Expresa tus sentimientos con los arreglos florales más hermosos. Desde rosas clásicas hasta diseños modernos para cada ocasión especial.",
    gradientFrom: "from-pink-400",
    gradientTo: "to-yellow-300",
    image: "/images/logos/flower-icon-1.png"
  },
  "dulces": {
    title: "Dulces & Postres",
    description: "Descubre una selección de los mejores dulces artesanales y postres gourmet. Perfectos para endulzar cualquier momento.",
    gradientFrom: "from-purple-400",
    gradientTo: "to-pink-300",
  },
  "eventos-cenas": {
    title: "Eventos & Cenas",
    description: "Todo lo que necesitas para hacer tus eventos inolvidables. Desde decoración hasta experiencias gastronómicas únicas.",
    gradientFrom: "from-blue-400",
    gradientTo: "to-green-300",
  },
  "regalos": {
    title: "Tienda de Regalos",
    description: "Encuentra el regalo perfecto para cada persona especial. Curación de productos únicos y experiencias memorables.",
    gradientFrom: "from-orange-400",
    gradientTo: "to-red-300",
  },
};

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  // Get category from database
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, params.slug),
  });

  if (!category) {
    notFound();
  }

  // Get category display info
  const info = categoryInfo[params.slug] || {
    title: category.name,
    description: category.description || "Descubre nuestra selección curada de productos.",
    gradientFrom: "from-gray-400",
    gradientTo: "to-gray-300",
  };

  // Fetch products for this category
  const { products } = await getFilteredProducts({
    categoryIds: [category.id],
    limit: 12,
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroBanner
        title={info.title}
        description={info.description}
        categoryName={category.name}
        categorySlug={category.slug}
        imageUrl={info.image}
        gradientFrom={info.gradientFrom}
        gradientTo={info.gradientTo}
      />

      {/* Filters & Sort */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-univers">Handpicked</h2>
          <Link href="/products" className="text-sm font-univers hover:underline">
            Ver todos
          </Link>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((product) => (
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
                    <p className="text-xs text-gray-600 font-univers uppercase">+ {product.vendor.businessName}</p>
                  )}
                  <p className="font-univers">${product.price}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 font-univers">No hay productos disponibles en esta categoría.</p>
          </div>
        )}
      </section>
    </div>
  );
}