import React, { createContext, useContext } from 'react';
import { useFavorites, useAddToFavorites, useRemoveFromFavorites } from '@/api/hooks';
import { useAuth } from '@/context/auth_context';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { data: favoritesData, isLoading, error, refetch } = useFavorites();
    const addToFavoritesMutation = useAddToFavorites();
    const removeFromFavoritesMutation = useRemoveFromFavorites();

    // Calculate favorites count
    const favoritesCount = React.useMemo(() => {
        if (!favoritesData) return 0;
        return Array.isArray(favoritesData) ? favoritesData.length : 0;
    }, [favoritesData]);

    // Check if product/variant is in favorites
    const isFavorite = React.useCallback((variantId, productId) => {
        if (!favoritesData) return false;
        return favoritesData.some(fav =>
            fav.variantId === variantId || fav.productId === productId
        );
    }, [favoritesData]);

    // Toggle favorite status
    const toggleFavorite = React.useCallback(async (variantId, productId) => {
        if (!isAuthenticated) {
            // Could show login prompt here
            console.log('User must be logged in to manage favorites');
            return;
        }

        try {
            if (isFavorite(variantId, productId)) {
                await removeFromFavoritesMutation.mutateAsync({ variantId });
            } else {
                await addToFavoritesMutation.mutateAsync({ variantId, productId });
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }, [isAuthenticated, isFavorite, addToFavoritesMutation, removeFromFavoritesMutation]);

    // Add to favorites
    const addToFavorites = React.useCallback(async (variantId, productId) => {
        if (!isAuthenticated) {
            console.log('User must be logged in to add favorites');
            return;
        }

        try {
            await addToFavoritesMutation.mutateAsync({ variantId, productId });
        } catch (error) {
            console.error('Error adding to favorites:', error);
        }
    }, [isAuthenticated, addToFavoritesMutation]);

    // Remove from favorites
    const removeFromFavorites = React.useCallback(async (variantId) => {
        if (!isAuthenticated) {
            console.log('User must be logged in to remove favorites');
            return;
        }

        try {
            await removeFromFavoritesMutation.mutateAsync({ variantId });
        } catch (error) {
            console.error('Error removing from favorites:', error);
        }
    }, [isAuthenticated, removeFromFavoritesMutation]);

    const value = {
        favoritesData: favoritesData || [],
        favoritesCount,
        isLoading,
        error,
        refetch,
        isFavorite,
        toggleFavorite,
        addToFavorites,
        removeFromFavorites,
        isAddingToFavorites: addToFavoritesMutation.isLoading,
        isRemovingFromFavorites: removeFromFavoritesMutation.isLoading
    };

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavoritesContext = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavoritesContext must be used within a FavoritesProvider');
    }
    return context;
};

export default FavoritesContext; 