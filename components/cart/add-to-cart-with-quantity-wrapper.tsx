"use client";

import { AddToCartWithQuantity } from "./add-to-cart-with-quantity";

interface AddToCartWithQuantityWrapperProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    vendorId: string;
    vendorName: string;
    stock?: number;
  };
  className?: string;
}

export function AddToCartWithQuantityWrapper({ 
  product, 
  className 
}: AddToCartWithQuantityWrapperProps) {
  return (
    <AddToCartWithQuantity 
      product={product}
      className={className}
    />
  );
}