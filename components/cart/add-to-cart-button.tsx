"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { Plus, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    vendorId: string;
    vendorName: string;
  };
  className?: string;
  showIcon?: boolean;
}

export function AddToCartButton({ 
  product, 
  className,
  showIcon = true 
}: AddToCartButtonProps) {
  const { addToCart, toggleCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const t = useTranslations('Products');

  const handleAddToCart = () => {
    addToCart(product);
    setIsAdded(true);
    
    // Show the cart
    setTimeout(() => {
      toggleCart();
    }, 500);

    // Reset the button state after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <Button
      onClick={handleAddToCart}
      className={cn(
        "bg-black text-white hover:bg-gray-800 transition-all",
        isAdded && "bg-green-600 hover:bg-green-600",
        className
      )}
      disabled={isAdded}
    >
      {showIcon && (
        isAdded ? (
          <Check className="h-4 w-4 mr-2" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )
      )}
      {isAdded ? t('added') : t('addToCart')}
    </Button>
  );
}