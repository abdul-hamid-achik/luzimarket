"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";
import { QuickViewModal } from "./quick-view-modal";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  images: string[] | null;
  stock: number;
  vendor: {
    id: string;
    businessName: string;
  } | null;
  category: {
    id: number | string;
    name: string;
    slug: string;
  } | null;
}

interface ProductsGridProps {
  products: Product[];
}

export function ProductsGrid({ products }: ProductsGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleQuickView = (product: Product) => {
    // Transform the product data for the quick view modal
    const quickViewProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: (product.images || []) as string[],
      vendorName: product.vendor?.businessName || "Vendedor",
      vendorId: product.vendor?.id || "",
      categoryName: product.category?.name || null,
      stock: product.stock,
    };
    
    setSelectedProduct(quickViewProduct);
    setIsQuickViewOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              images: (product.images || []) as string[],
            }}
            onQuickView={handleQuickView}
          />
        ))}
      </div>

      <QuickViewModal
        product={selectedProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setSelectedProduct(null);
        }}
      />
    </>
  );
}