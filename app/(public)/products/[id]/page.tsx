import { notFound } from "next/navigation";
import Image from "next/image";
import { Heart, Truck, Shield, Package } from "lucide-react";
import { db } from "@/db";
import { products, vendors, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import AddToCartButton from "@/components/cart/add-to-cart-button";

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
  params: { id: string }
}) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.categorySlug!, product.id);
  const productImages = product.images as string[] || [];
  const productTags = product.tags as string[] || [];

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
                {product.stock > 0 
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