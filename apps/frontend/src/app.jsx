import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/context/auth_context';
import { CartProvider } from '@/context/cart_context';
import { FavoritesProvider } from '@/context/favorites_context';
import { router } from '@/router';
import { Analytics } from '@vercel/analytics/react';

const queryClient = new QueryClient();

const AppComponent = () => (
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <CartProvider>
                    <FavoritesProvider>
                        <RouterProvider router={router} />
                        <ReactQueryDevtools initialIsOpen={false} />
                        <Analytics />
                    </FavoritesProvider>
                </CartProvider>
            </AuthProvider>
        </QueryClientProvider>
    </React.StrictMode>
);

export default AppComponent;