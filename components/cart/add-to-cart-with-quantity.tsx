"use client";

import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useCart } from "@/contexts/cart-context";
import { ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';
import { checkProductStock } from "@/lib/actions/inventory";
import { toast } from "sonner";

interface AddToCartWithQuantityProps {
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

export function AddToCartWithQuantity({ 
  product, 
  className 
}: AddToCartWithQuantityProps) {
  const { addToCart, toggleCart, state } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('Cart');
  const tProducts = useTranslations('Products');

  const handleAddToCart = async () => {
    setIsLoading(true);
    
    try {
      // Check current quantity in cart
      const currentCartItem = state.items.find((item: any) => item.id === product.id);
      const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;
      const requestedQuantity = currentQuantity + quantity;

      // Check stock availability
      const stockCheck = await checkProductStock(product.id, requestedQuantity);
      
      if (!stockCheck.isAvailable) {
        if (stockCheck.availableStock === 0) {
          toast.error(t('stockValidation.outOfStock'), {
            description: t('stockValidation.outOfStockDescription', { productName: product.name })
          });
        } else {
          const remainingCanAdd = stockCheck.availableStock - currentQuantity;
          toast.error(t('stockValidation.limitedStock'), {
            description: remainingCanAdd === 1 
              ? t('stockValidation.limitedStockDescriptionSingle', { productName: product.name })
              : t('stockValidation.limitedStockDescriptionMultiple', { 
                  count: remainingCanAdd, 
                  productName: product.name 
                })
          });
        }
        return;
      }

      // Add to cart with the selected quantity
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      
      setIsAdded(true);
      
      toast.success(t('stockValidation.addedSuccess'), {
        description: quantity === 1 
          ? t('stockValidation.addedSuccessDescription', { productName: product.name })
          : t('stockValidation.addedSuccessDescriptionMultiple', { 
              count: quantity, 
              productName: product.name 
            })
      });
      
      // Show the cart
      setTimeout(() => {
        toggleCart();
      }, 500);

      // Reset the button state and quantity after 2 seconds
      setTimeout(() => {
        setIsAdded(false);
        setQuantity(1);
      }, 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(t('stockValidation.addError'), {
        description: t('stockValidation.addErrorDescription')
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-univers text-gray-600">
            {tProducts('quantity')}:
          </span>
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={setQuantity}
            max={product.stock || 99}
            disabled={isLoading || isAdded}
          />
        </div>
        
        {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
          <span className="text-sm text-orange-600 font-univers">
            {tProducts('lowStock', { count: product.stock })}
          </span>
        )}
      </div>
      
      <Button
        onClick={handleAddToCart}
        className={cn(
          "w-full bg-black text-white hover:bg-gray-800 transition-all",
          isAdded && "bg-green-600 hover:bg-green-600",
          isLoading && "opacity-75 cursor-not-allowed"
        )}
        disabled={isAdded || isLoading}
        size="lg"
      >
        {isAdded ? (
          <Check className="h-5 w-5 mr-2" />
        ) : isLoading ? (
          <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <ShoppingBag className="h-5 w-5 mr-2" />
        )}
        {isLoading 
          ? t('stockValidation.checking') 
          : isAdded 
          ? tProducts('added') 
          : tProducts('addToCart')
        }
      </Button>
    </div>
  );
}