"use client";

import { ReactNode, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/contexts/cart-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { ShippingLocationProvider } from "@/contexts/shipping-location-context";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          gcTime: 10 * 60 * 1000, // 10 minutes
          retry: (failureCount, error: any) => {
            // Don't retry on 4xx errors except 408, 429
            if (error?.status >= 400 && error?.status < 500 && error?.status !== 408 && error?.status !== 429) {
              return false;
            }
            return failureCount < 3;
          },
        },
        mutations: {
          retry: false,
        },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}