import { notFound } from "next/navigation";
import Image from "next/image";
import { Heart, Truck, Shield, Package } from "lucide-react";
import { db } from "@/db";
import { products, vendors, categories, reviews, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import AddToCartButton from "@/components/cart/add-to-cart-button";
import { ProductReviews } from "@/components/products/product-reviews";
import { auth } from "@/lib/auth";

async function getProduct(id: string) {
  const product = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      images: products.images,
      tags: products.tags,
      stock: products.stock,
      vendorName: vendors.businessName,
      vendorId: vendors.id,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);

  return product[0] || null;
}

async function getRelatedProducts(categorySlug: string, currentProductId: string) {
  const relatedProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      images: products.images,
      vendorName: vendors.businessName,
    })
    .from(products)
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(categories.slug, categorySlug))
    .limit(4);

  return relatedProducts.filter(p => p.id !== currentProductId);
}

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.categorySlug!, product.id);
  const productImages = product.images as string[] || [];
  const productTags = product.tags as string[] || [];

  // Fetch reviews data
  const productReviews = await db.query.reviews.findMany({
    where: eq(reviews.productId, product.id),
    with: {
      user: {
        columns: {
          name: true,
        },
      },
    },
    orderBy: (reviews, { desc }) => desc(reviews.createdAt),
  });

  // Calculate rating statistics
  const ratingCounts = await db
    .select({
      rating: reviews.rating,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(reviews)
    .where(eq(reviews.productId, product.id))
    .groupBy(reviews.rating);

  const totalReviews = productReviews.length;
  const averageRating = totalReviews > 0
    ? productReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = ratingCounts.find(rc => rc.rating === rating)?.count || 0;
    return {
      rating,
      count,
      percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
    };
  });

  // Check if current user can review
  const session = await auth();
  let canReview = false;
  
  if (session) {
    // Check if user hasn't already reviewed this product
    const existingReview = productReviews.find(r => r.userId === session.user.id);
    canReview = !existingReview;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square relative bg-gray-100 overflow-hidden">
              <Image
                src={productImages[0] || "/images/placeholder.jpg"}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* Thumbnail gallery */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    className="aspect-square relative bg-gray-100 overflow-hidden border-2 border-transparent hover:border-black transition-colors"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-times-now">{product.name}</h1>
              <p className="text-sm font-univers text-gray-600">Por {product.vendorName}</p>
              
              {/* Rating */}
              {totalReviews > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-univers text-gray-600">
                    {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? "opinión" : "opiniones"})
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="text-2xl font-univers">
              ${Number(product.price).toLocaleString('es-MX')} MXN
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm font-univers">
                <p>{product.description}</p>
              </div>
            )}

            {/* Tags */}
            {productTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {productTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-xs font-univers rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <AddToCartButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    image: productImages[0] || "/images/placeholder.jpg",
                    vendorId: product.vendorId!,
                    vendorName: product.vendorName!,
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              {/* Stock info */}
              <p className="text-sm font-univers text-gray-600">
                {product.stock && product.stock > 0 
                  ? `${product.stock} disponibles`
                  : "Sin stock disponible"
                }
              </p>
            </div>

            {/* Features */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-univers">Envío disponible</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-univers">Compra protegida</span>
              </div>
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-univers">Empaque especial disponible</span>
              </div>
            </div>

            {/* Category */}
            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm font-univers text-gray-600">
                Categoría: <a href={`/category/${product.categorySlug}`} className="underline hover:no-underline">{product.categoryName}</a>
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <ProductReviews
          productId={product.id}
          reviews={productReviews.map(review => ({
            ...review,
            createdAt: review.createdAt || new Date(),
            isVerifiedPurchase: review.isVerifiedPurchase || false,
            helpfulCount: review.helpfulCount || 0,
            user: {
              name: review.user.name || "Usuario"
            }
          }))}
          averageRating={averageRating}
          totalReviews={totalReviews}
          ratingDistribution={ratingDistribution}
          canReview={canReview}
        />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-times-now mb-8">Productos relacionados</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => {
                const images = relatedProduct.images as string[] || [];
                return (
                  <a
                    key={relatedProduct.id}
                    href={`/products/${relatedProduct.id}`}
                    className="group"
                  >
                    <div className="aspect-square relative bg-gray-100 mb-3 overflow-hidden">
                      <Image
                        src={images[0] || "/images/placeholder.jpg"}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-univers text-sm">{relatedProduct.name}</h3>
                    <p className="font-univers text-sm text-gray-600">+ {relatedProduct.vendorName}</p>
                    <p className="font-univers mt-1">${Number(relatedProduct.price).toLocaleString('es-MX')}</p>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}