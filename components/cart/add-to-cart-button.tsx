"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { Plus, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';
import { checkProductStock } from "@/lib/actions/inventory";
import { toast } from "sonner";

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
  const { addToCart, toggleCart, state } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('Products');

  const handleAddToCart = async () => {
    setIsLoading(true);
    
    try {
      // Check current quantity in cart
      const currentCartItem = state.items.find((item: any) => item.id === product.id);
      const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;
      const requestedQuantity = currentQuantity + 1;

      // Check stock availability
      const stockCheck = await checkProductStock(product.id, requestedQuantity);
      
      if (!stockCheck.isAvailable) {
        if (stockCheck.availableStock === 0) {
          toast.error("😔 Producto agotado", {
            description: `Lo sentimos, ${product.name} no está disponible en este momento. Te notificaremos cuando esté de vuelta.`
          });
        } else {
          toast.error("⚠️ Stock limitado", {
            description: `Solo ${stockCheck.availableStock === 1 ? 'queda 1 unidad' : `quedan ${stockCheck.availableStock} unidades`} de ${product.name}. ¡Apresúrate!`
          });
        }
        return;
      }

      // Add to cart if stock is available
      addToCart(product);
      setIsAdded(true);
      
      toast.success("🛒 ¡Agregado al carrito!", {
        description: `${product.name} se agregó exitosamente. ¡Excelente elección!`
      });
      
      // Show the cart
      setTimeout(() => {
        toggleCart();
      }, 500);

      // Reset the button state after 2 seconds
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("❌ Error al agregar", {
        description: "No pudimos agregar el producto al carrito. Por favor, intenta de nuevo o contacta a soporte."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAddToCart}
      className={cn(
        "bg-black text-white hover:bg-gray-800 transition-all",
        isAdded && "bg-green-600 hover:bg-green-600",
        isLoading && "opacity-75 cursor-not-allowed",
        className
      )}
      disabled={isAdded || isLoading}
    >
      {showIcon && (
        isAdded ? (
          <Check className="h-4 w-4 mr-2" />
        ) : isLoading ? (
          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )
      )}
      {isLoading ? 'Verificando stock...' : isAdded ? t('added') : t('addToCart')}
    </Button>
  );
}