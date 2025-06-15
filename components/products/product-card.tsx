"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import AddToCartButton from "@/components/cart/add-to-cart-button";
import { useWishlist } from "@/contexts/wishlist-context";
import { toast } from "sonner";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: string;
    images: string[];
    vendor?: {
      id: string;
      businessName: string;
    } | null;
  };
  className?: string;
  onQuickView?: (product: any) => void;
}

export function ProductCard({ product, className, onQuickView }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isWishlisted) {
      removeFromWishlist(product.id);
      toast.success("Eliminado de favoritos");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.images[0] || "/images/links/pia-riverola.webp",
        vendorId: product.vendor?.id || "",
        vendorName: product.vendor?.businessName || "Vendedor",
      });
      toast.success("Agregado a favoritos");
    }
  };

  return (
    <Link 
      href={`/products/${product.id}`} 
      className={cn("group block", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square mb-4 overflow-hidden bg-gray-100 rounded-lg">
        <Image
          src={product.images[0] || "/images/links/pia-riverola.webp"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay on hover */}
        <div className={cn(
          "absolute inset-0 bg-black/0 transition-all duration-300",
          isHovered && "bg-black/10"
        )} />
        
        {/* Wishlist button */}
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "absolute top-3 right-3 h-9 w-9 bg-white/90 hover:bg-white transition-all duration-200",
            "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          )}
          onClick={handleWishlistToggle}
        >
          <Heart 
            className={cn(
              "h-4 w-4 transition-colors",
              isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700"
            )} 
          />
        </Button>
        
        {/* Quick actions on hover */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-3 transition-all duration-300",
          "opacity-0 group-hover:opacity-100 translate-y-full group-hover:translate-y-0"
        )}>
          <div className="flex gap-2">
            {onQuickView && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.preventDefault();
                  onQuickView(product);
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                Vista rápida
              </Button>
            )}
            <AddToCartButton
              product={{
                id: product.id,
              name: product.name,
              price: parseFloat(product.price),
              image: product.images[0] || "/images/links/pia-riverola.webp",
              vendorId: product.vendor?.id || "",
              vendorName: product.vendor?.businessName || "Vendedor",
            }}
              className={cn(
                "h-10 text-sm",
                onQuickView ? "flex-1" : "w-full"
              )}
              showIcon={false}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-univers text-sm group-hover:text-gray-700 transition-colors">
          {product.name}
        </h3>
        {product.vendor && (
          <p className="text-xs text-gray-600 font-univers">
            + {product.vendor.businessName}
          </p>
        )}
        <p className="font-univers font-medium">
          ${parseFloat(product.price).toLocaleString('es-MX')} MXN
        </p>
      </div>
    </Link>
  );
}