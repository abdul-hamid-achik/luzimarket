"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/cart-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { ShippingLocationProvider } from "@/contexts/shipping-location-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <ShippingLocationProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
            </WishlistProvider>
          </CartProvider>
        </ShippingLocationProvider>
      </CurrencyProvider>
    </SessionProvider>
  );
}