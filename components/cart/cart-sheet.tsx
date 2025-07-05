"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';

export default function CartSheet() {
  const { state, toggleCart, removeFromCart, updateQuantity, getTotalPrice, getTotalItems } = useCart();
  const t = useTranslations('Cart');

  return (
    <Sheet open={state.isOpen} onOpenChange={toggleCart} data-testid="cart-sheet">
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-univers">{t('title', { count: getTotalItems() })}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-6">
            {state.items.length === 0 ? (
              <p className="text-center text-gray-500 font-univers py-8">
                {t('empty')}
              </p>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg" data-testid="cart-item">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 space-y-1">
                      <h3 className="font-univers text-sm font-medium">{item.name}</h3>
                      <p className="text-xs text-gray-600 font-univers">{t('by')} {item.vendorName}</p>
                      <p className="font-univers text-sm">${item.price.toLocaleString('es-MX')} MXN</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        aria-label={t('removeItem', { name: item.name })}
                        className="text-gray-400 hover:text-gray-600"
                        data-testid={`remove-item-${item.id}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label={t('decreaseQuantity')}
                          className="h-6 w-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100"
                          data-testid={`decrease-quantity-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-univers w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={t('increaseQuantity')}
                          className="h-6 w-6 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100"
                          data-testid={`increase-quantity-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {state.items.length > 0 && (
            <div className="border-t pt-6 pb-2 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-univers text-lg">{t('total')}</span>
                <span className="font-univers text-lg font-semibold">
                  ${getTotalPrice().toLocaleString('es-MX')} MXN
                </span>
              </div>
              
              <div className="space-y-2">
                <Button
                  asChild
                  className="w-full bg-black text-white hover:bg-gray-800"
                  onClick={toggleCart}
                >
                  <Link href="/checkout" data-testid="checkout-link">
                    {t('checkout')}
                  </Link>
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={toggleCart}
                >
                  {t('continueShopping')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}