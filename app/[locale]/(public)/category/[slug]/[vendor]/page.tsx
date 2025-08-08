import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { products, categories, vendors } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ProductCard } from "@/components/products/product-card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";

export default async function CategoryVendorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string; vendor: string }>;
}) {
  const { locale, slug: categorySlug, vendor: vendorSlug } = await params;
  const t = await getTranslations("Products");

  // Fetch category
  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  if (!category.length) {
    notFound();
  }

  // Fetch vendor
  const vendor = await db
    .select()
    .from(vendors)
    .where(eq(vendors.slug, vendorSlug))
    .limit(1);

  if (!vendor.length) {
    notFound();
  }

  const categoryData = category[0];
  const vendorData = vendor[0];

  // Fetch products for this category and vendor
  const categoryProducts = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.categoryId, categoryData.id),
        eq(products.vendorId, vendorData.id),
        eq(products.isActive, true)
      )
    );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{t("home")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={{ pathname: '/category/[slug]', params: { slug: categorySlug } }}>
                {categoryData.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{vendorData.businessName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-times-now mb-4">
          {categoryData.name} - {vendorData.businessName}
        </h1>
        {vendorData.description && (
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {vendorData.description}
          </p>
        )}
      </div>

      {/* Products Grid */}
      {categoryProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">{t("noProducts")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categoryProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                images: product.images || [],
                vendor: {
                  id: vendorData.id,
                  businessName: vendorData.businessName
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}