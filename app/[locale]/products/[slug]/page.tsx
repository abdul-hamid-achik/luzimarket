import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from "next/image";
import { db } from "@/db";
import { products, vendors, categories } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, Package, Shield, Gift } from "lucide-react";
import { ProductReviews } from "@/components/products/product-reviews";
import { ProductsGrid } from "@/components/products/products-grid";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function getProduct(slug: string) {
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      vendor: true,
      category: true,
    },
  });

  if (!product || !product.isActive) {
    return null;
  }

  // Get related products
  const relatedProducts = await db
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
        eq(products.categoryId, product.categoryId),
        eq(products.isActive, true),
        ne(products.id, product.id)
      )
    )
    .limit(4);

  return { product, relatedProducts };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('Products');
  const productData = await getProduct(slug);

  if (!productData) {
    notFound();
  }

  const { product, relatedProducts } = productData;
  const images = product.images as string[] || [];

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm font-univers mb-8">
          <ol className="flex items-center gap-2 text-gray-600">
            <li><a href={`/${locale}`} className="hover:text-black">Inicio</a></li>
            <li>/</li>
            <li><a href={`/${locale}/categories`} className="hover:text-black">Categorías</a></li>
            <li>/</li>
            <li><a href={`/${locale}/category/${product.category?.slug}`} className="hover:text-black">{product.category?.name}</a></li>
            <li>/</li>
            <li className="text-black">{product.name}</li>
          </ol>
        </nav>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {images[0] ? (
                <Image
                  src={images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Thumbnail gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative aspect-square bg-gray-100 rounded overflow-hidden cursor-pointer hover:opacity-80">
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-times-now mb-2">{product.name}</h1>
              <p className="text-sm font-univers text-gray-600 uppercase tracking-wider">
                POR {product.vendor?.businessName || 'VENDEDOR'}
              </p>
            </div>

            <div className="text-3xl font-univers">
              ${Number(product.price).toLocaleString('es-MX')} MXN
            </div>

            <div className="prose prose-sm font-univers">
              <p>{product.description}</p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <AddToCartButton 
                  product={{
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    image: images[0] || '',
                    vendorId: product.vendorId,
                    vendorName: product.vendor?.businessName || '',
                  }}
                  className="flex-1"
                />
                <WishlistButton 
                  product={{
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    image: images[0] || '',
                    vendor: product.vendor?.businessName || '',
                  }}
                />
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-b">
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto mb-2" />
                <p className="text-xs font-univers">{t('shippingAvailable')}</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2" />
                <p className="text-xs font-univers">{t('securePayment')}</p>
              </div>
              <div className="text-center">
                <Gift className="h-6 w-6 mx-auto mb-2" />
                <p className="text-xs font-univers">{t('specialPackaging')}</p>
              </div>
            </div>

            {/* Vendor Info */}
            <div className="space-y-2">
              <p className="text-sm font-univers">
                <span className="text-gray-600">{t('vendor')}:</span> {product.vendor?.businessName}
              </p>
              <p className="text-sm font-univers">
                <span className="text-gray-600">{t('category')}:</span> {product.category?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="description" className="mb-16">
          <TabsList className="w-full justify-start border-b">
            <TabsTrigger value="description" className="font-univers">
              {t('description')}
            </TabsTrigger>
            <TabsTrigger value="specifications" className="font-univers">
              {t('specifications')}
            </TabsTrigger>
            <TabsTrigger value="shipping" className="font-univers">
              {t('shipping')}
            </TabsTrigger>
            <TabsTrigger value="returns" className="font-univers">
              {t('returns')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <div className="prose prose-sm font-univers max-w-none">
              <p>{product.description}</p>
            </div>
          </TabsContent>
          
          <TabsContent value="specifications" className="mt-6">
            <div className="prose prose-sm font-univers max-w-none">
              <p>Especificaciones técnicas del producto.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="shipping" className="mt-6">
            <div className="prose prose-sm font-univers max-w-none">
              <p>Información sobre envío y tiempos de entrega.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="returns" className="mt-6">
            <div className="prose prose-sm font-univers max-w-none">
              <p>Política de devoluciones y cambios.</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Reviews Section */}
        <ProductReviews 
          productId={product.id} 
          reviews={[]}
          averageRating={0}
          totalReviews={0}
          ratingDistribution={[]}
          canReview={false}
        />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-times-now mb-8">{t('relatedProducts')}</h2>
            <ProductsGrid products={relatedProducts} />
          </section>
        )}
      </div>
    </main>
  );
}