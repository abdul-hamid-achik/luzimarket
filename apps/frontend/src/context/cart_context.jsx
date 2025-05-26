import React, { createContext, useContext } from 'react';
import { useCart } from '@/api/hooks';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { data: cartData, isLoading, error, refetch } = useCart();

    // Calculate cart count (sum of all quantities)
    const cartCount = React.useMemo(() => {
        if (!cartData?.items) return 0;
        return cartData.items.reduce((total, item) => total + (item.quantity || 0), 0);
    }, [cartData?.items]);

    // Calculate cart total
    const cartTotal = React.useMemo(() => {
        if (!cartData?.items) return 0;
        return cartData.items.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);
    }, [cartData?.items]);

    // Check if product/variant is in cart
    const isInCart = React.useCallback((variantId) => {
        if (!cartData?.items) return false;
        return cartData.items.some(item => item.variantId === variantId);
    }, [cartData?.items]);

    const value = {
        cartData,
        cartCount,
        cartTotal,
        isLoading,
        error,
        refetch,
        isInCart,
        items: cartData?.items || []
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCartContext must be used within a CartProvider');
    }
    return context;
};

export default CartContext; 