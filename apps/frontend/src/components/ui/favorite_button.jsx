import React from 'react';
import { useFavoritesContext } from '@/context/favorites_context';
import { useAuth } from '@/context/auth_context';
import './favorite_button.css';

const FavoriteButton = ({
    productId,
    variantId,
    size = 'medium',
    className = '',
    showTooltip = true,
    style = {}
}) => {
    const { isAuthenticated } = useAuth();
    const {
        isFavorite,
        toggleFavorite,
        isAddingToFavorites,
        isRemovingFromFavorites
    } = useFavoritesContext();

    const isFav = isFavorite(variantId, productId);
    const isLoading = isAddingToFavorites || isRemovingFromFavorites;

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            // Could show a login modal here
            console.log('Please log in to manage favorites');
            return;
        }

        toggleFavorite(variantId, productId);
    };

    const sizeClasses = {
        small: 'favorite-btn-small',
        medium: 'favorite-btn-medium',
        large: 'favorite-btn-large'
    };

    return (
        <button
            className={`favorite-button ${sizeClasses[size]} ${isFav ? 'is-favorite' : ''} ${isLoading ? 'is-loading' : ''} ${className}`}
            onClick={handleClick}
            disabled={isLoading}
            title={showTooltip ? (isFav ? 'Quitar de favoritos' : 'Agregar a favoritos') : ''}
            style={style}
            aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
            {isLoading ? (
                <div className="favorite-loading">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="favorite-icon">
                    {isFav ? '❤️' : '🤍'}
                </div>
            )}
        </button>
    );
};

export default FavoriteButton; 