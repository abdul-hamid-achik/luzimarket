import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { db } from "@/db";
import { vendors, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface BrandsPageProps {
  params: Promise<{ locale: string }>;
}

async function getActiveVendors() {
  const vendorsWithProducts = await db
    .select({
      id: vendors.id,
      businessName: vendors.businessName,
      slug: vendors.slug,
      description: vendors.description,
      city: vendors.city,
      state: vendors.state,
      productCount: sql<number>`count(${products.id})`,
    })
    .from(vendors)
    .leftJoin(products, eq(vendors.id, products.vendorId))
    .where(eq(vendors.isActive, true))
    .groupBy(vendors.id)
    .orderBy(vendors.businessName);

  return vendorsWithProducts;
}

export default async function BrandsPage({ params }: BrandsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('Navigation');
  const activeVendors = await getActiveVendors();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16">
        <div className="text-center px-8">
          <h1 className="text-4xl md:text-5xl font-times-now mb-4">
            Tiendas + Marcas
          </h1>
          <p className="text-base md:text-lg font-univers text-gray-600 max-w-2xl mx-auto">
            Descubre nuestras tiendas y marcas cuidadosamente seleccionadas
          </p>
        </div>
      </section>

      {/* Brands Grid */}
      <section className="py-16 px-4 md:px-8">
        {activeVendors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-univers">
              Pronto tendremos tiendas disponibles
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeVendors.map((vendor) => (
              <Link
                key={vendor.id}
                href={{ pathname: "/brands/[slug]", params: { slug: vendor.slug } }}
                className="group"
              >
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* Vendor Image Placeholder */}
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-4xl font-times-now text-gray-300">
                        {vendor.businessName.charAt(0)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Vendor Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-univers mb-2 group-hover:text-gray-600 transition-colors">
                      {vendor.businessName}
                    </h3>
                    {vendor.description && (
                      <p className="text-sm text-gray-600 font-univers mb-3 line-clamp-2">
                        {vendor.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm font-univers text-gray-500">
                      <span>{vendor.city}, {vendor.state}</span>
                      <span>{vendor.productCount} productos</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-16">
        <div className="text-center px-8">
          <h2 className="text-3xl font-times-now mb-4">
            ¿Quieres ser parte de LUZIMARKET?
          </h2>
          <p className="text-lg font-univers mb-8 opacity-90">
            Únete a nuestra plataforma de vendedores seleccionados
          </p>
          <Link
            href="/vendor/register"
            className="inline-block bg-white text-black px-8 py-3 font-univers hover:bg-gray-100 transition-colors"
          >
            Regístrate como vendedor
          </Link>
        </div>
      </section>
    </main>
  );
}