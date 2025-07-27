"use client";

import { useCurrency } from "@/contexts/currency-context";

interface ProductPriceDisplayProps {
  price: number;
  className?: string;
}

export function ProductPriceDisplay({ price, className = "text-3xl font-univers" }: ProductPriceDisplayProps) {
  const { formatPrice } = useCurrency();
  
  return (
    <div className={className}>
      {formatPrice(price)}
    </div>
  );
}