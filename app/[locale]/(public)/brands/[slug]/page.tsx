import { notFound } from "next/navigation";
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata, ResolvingMetadata } from 'next';
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { db } from "@/db";
import { vendors, products, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProductCard } from "@/components/products/product-card";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
}

async function getVendor(slug: string) {
  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.slug, slug))
    .limit(1);
  
  return vendor[0] || null;
}

async function getVendorProducts(vendorId: string) {
  const vendorProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      images: products.images,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.vendorId, vendorId))
    .orderBy(products.createdAt);
  
  return vendorProducts;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendor(slug);

  if (!vendor) {
    return {
      title: 'Tienda no encontrada',
      description: 'La tienda que buscas no está disponible',
    };
  }

  return {
    title: `${vendor.businessName} | Luzimarket`,
    description: vendor.description || `Descubre los productos de ${vendor.businessName} en Luzimarket. ${vendor.city}, ${vendor.state}.`,
    openGraph: {
      title: vendor.businessName,
      description: vendor.description || `Productos de ${vendor.businessName}`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: vendor.businessName,
      description: vendor.description || `Productos de ${vendor.businessName}`,
    },
    alternates: {
      canonical: `/tiendas-marcas/${slug}`,
      languages: {
        'es': `/es/tiendas-marcas/${slug}`,
        'en': `/en/brands/${slug}`,
      },
    },
  };
}

export default async function BrandDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  
  const vendor = await getVendor(slug);
  
  if (!vendor) {
    notFound();
  }
  
  const vendorProducts = await getVendorProducts(vendor.id);
  const t = await getTranslations('Navigation');
  
  return (
    <main className="min-h-screen">
      {/* Vendor Header */}
      <section className="bg-gray-50 py-16">
        <div className="px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-times-now mb-4">
              {vendor.businessName}
            </h1>
            {vendor.description && (
              <p className="text-base md:text-lg font-univers text-gray-600 mb-4">
                {vendor.description}
              </p>
            )}
            <p className="text-sm font-univers text-gray-500">
              {vendor.city}, {vendor.state}
            </p>
            
            {/* Social Links */}
            <div className="flex justify-center gap-4 mt-6">
              {vendor.websiteUrl && (
                <a
                  href={vendor.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-univers underline hover:text-gray-600"
                >
                  Sitio web
                </a>
              )}
              {vendor.instagramUrl && (
                <a
                  href={`https://instagram.com/${vendor.instagramUrl.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-univers underline hover:text-gray-600"
                >
                  Instagram
                </a>
              )}
              {vendor.facebookUrl && (
                <a
                  href={`https://facebook.com/${vendor.facebookUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-univers underline hover:text-gray-600"
                >
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Vendor Info */}
      <section className="py-8 px-8 border-b">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {vendor.businessHours && (
            <div>
              <h3 className="font-univers text-sm font-medium mb-2">Horario</h3>
              <p className="text-sm font-univers text-gray-600">{vendor.businessHours}</p>
            </div>
          )}
          {vendor.hasDelivery && (
            <div>
              <h3 className="font-univers text-sm font-medium mb-2">Envío</h3>
              <p className="text-sm font-univers text-gray-600">
                {vendor.deliveryService === 'own' ? 'Envío propio' : 'Servicio externo'}
              </p>
            </div>
          )}
          <div>
            <h3 className="font-univers text-sm font-medium mb-2">Productos</h3>
            <p className="text-sm font-univers text-gray-600">{vendorProducts.length} productos</p>
          </div>
        </div>
      </section>
      
      {/* Products */}
      <section className="py-16 px-4 md:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-times-now">Productos de {vendor.businessName}</h2>
        </div>
        
        {vendorProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-univers">
              Esta tienda aún no tiene productos disponibles
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vendorProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  images: product.images as string[] || [],
                  vendor: {
                    id: vendor.id,
                    businessName: vendor.businessName,
                  },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}