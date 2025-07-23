"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/cart-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { CurrencyProvider } from "@/contexts/currency-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        <CartProvider>
          <WishlistProvider>
            {children}
          </WishlistProvider>
        </CartProvider>
      </CurrencyProvider>
    </SessionProvider>
  );
}