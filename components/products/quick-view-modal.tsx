"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { Link } from "@/i18n/navigation";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useTranslations } from "next-intl";

interface ProductQuickView {
  id: string;
  name: string;
  description: string | null;
  price: string;
  images: string[];
  vendorName: string;
  vendorId: string;
  categoryName: string | null;
  stock: number;
  averageRating?: number;
  totalReviews?: number;
}

interface QuickViewModalProps {
  product: ProductQuickView | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const t = useTranslations("Products.quickViewModal");

  if (!product) return null;

  const productImages = product.images || [];
  const selectedImage = productImages[selectedImageIndex] || "/images/links/pia-riverola.webp";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <VisuallyHidden>
          <DialogTitle>{t("title", { name: product.name })}</DialogTitle>
        </VisuallyHidden>

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Product Images */}
          <div className="relative bg-gray-50 p-8">
            <div className="aspect-square relative bg-white rounded-lg overflow-hidden">
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Image Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={t("viewImage", { number: index + 1 })}
                    className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${index === selectedImageIndex
                        ? "border-black"
                        : "border-gray-200 hover:border-gray-400"
                      }`}
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
          <div className="p-8 space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-times-now mb-2">{product.name}</h2>
              <p className="text-sm font-univers text-gray-600 mb-3">
                {t("by")} {product.vendorName}
              </p>

              {/* Rating */}
              {product.averageRating && product.totalReviews && product.totalReviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= Math.round(product.averageRating!)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-univers text-gray-600">
                    {product.averageRating.toFixed(1)} ({product.totalReviews} {product.totalReviews === 1 ? t("review") : t("reviews")})
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
              <div className="text-sm font-univers text-gray-700 leading-relaxed">
                {product.description.length > 200
                  ? `${product.description.substring(0, 200)}...`
                  : product.description}
              </div>
            )}

            {/* Category */}
            {product.categoryName && (
              <p className="text-sm font-univers text-gray-600">
                {t("categoryLabel")} <span className="font-medium">{product.categoryName}</span>
              </p>
            )}

            {/* Stock Info */}
            <p className="text-sm font-univers">
              {product.stock > 0 ? (
                <span className="text-green-600">
                  {t("available", { count: product.stock })}
                </span>
              ) : (
                <span className="text-red-600">{t("noStock")}</span>
              )}
            </p>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <div className="flex gap-3">
                {product.stock > 0 ? (
                  <AddToCartButton
                    product={{
                      id: product.id,
                      name: product.name,
                      price: Number(product.price),
                      image: productImages[0] || "/images/placeholder.jpg",
                      vendorId: product.vendorId,
                      vendorName: product.vendorName,
                    }}
                    className="flex-1"
                  />
                ) : (
                  <Button disabled className="flex-1">
                    {t("outOfStock")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12"
                >
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              <Link href={{ pathname: '/products/[slug]', params: { slug: product.id } }} className="block">
                <Button variant="outline" className="w-full">
                  {t("viewFullDetails")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}