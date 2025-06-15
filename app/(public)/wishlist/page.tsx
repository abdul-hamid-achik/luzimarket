"use client";

import { useWishlist } from "@/contexts/wishlist-context";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart } from "lucide-react";

export default function WishlistPage() {
  const { state, clearWishlist } = useWishlist();

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-times-now mb-2">Tu lista de favoritos está vacía</h1>
          <p className="text-gray-600 font-univers mb-6">
            Guarda tus productos favoritos para verlos más tarde
          </p>
          <Button asChild className="bg-black text-white hover:bg-gray-800">
            <Link href="/products">
              Explorar productos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-times-now">Mis Favoritos ({state.items.length})</h1>
          <Button
            variant="outline"
            onClick={clearWishlist}
            className="text-sm"
          >
            Limpiar lista
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {state.items.map((item) => (
            <ProductCard
              key={item.id}
              product={{
                id: item.id,
                name: item.name,
                slug: item.id, // Using id as slug for wishlist items
                price: item.price.toString(),
                images: [item.image],
                vendor: {
                  id: item.vendorId,
                  businessName: item.vendorName,
                },
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}