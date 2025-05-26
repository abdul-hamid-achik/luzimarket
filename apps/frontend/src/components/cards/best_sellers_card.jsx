import React from 'react';
import { Link } from 'react-router-dom';
import './best_sellers_card.css';

const BestSellersCard = ({ product, rank }) => {
    const {
        id,
        slug,
        name,
        description,
        price,
        imageUrl,
        imageAlt,
        totalSold,
        categoryName
    } = product;

    // Format price to Mexican pesos
    const formatPrice = (priceInCents) => {
        const pesos = priceInCents / 100;
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(pesos);
    };

    // Fallback image chain in case images fail to load
    const handleImageError = (e) => {
        const img = e.target;
        const currentSrc = img.src;

        // Try different fallback images in sequence
        const fallbackImages = [
            `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&auto=format`,
            `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&auto=format`,
            `https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&auto=format`,
            `https://picsum.photos/seed/${slug}/400/300`,
            `https://via.placeholder.com/400x300/f8f9fa/6c757d?text=${encodeURIComponent(name.substring(0, 20))}`
        ];

        // Find the next fallback that hasn't been tried yet
        const currentIndex = fallbackImages.findIndex(url => currentSrc.includes(url.split('?')[0]));
        const nextIndex = currentIndex + 1;

        if (nextIndex < fallbackImages.length) {
            img.src = fallbackImages[nextIndex];
        }
    };

    return (
        <div className="best-seller-card">
            <div className="best-seller-rank">
                <span className="rank-number">#{rank}</span>
                <span className="bestseller-badge">Best Seller</span>
            </div>

            <Link to={`/handpicked/productos/${id}`} className="product-link">
                <div className="product-image-container">
                    <img
                        src={imageUrl || `https://picsum.photos/seed/${slug}/400/300`}
                        alt={imageAlt || name}
                        className="product-image"
                        onError={handleImageError}
                        loading="lazy"
                    />
                    <div className="image-overlay">
                        <button className="quick-view-btn">Ver Producto</button>
                    </div>
                </div>
            </Link>

            <div className="product-info">
                <div className="product-category">{categoryName}</div>
                <h3 className="product-name">{name}</h3>
                <p className="product-description">{description}</p>

                <div className="product-stats">
                    <div className="price">{formatPrice(price)}</div>
                    <div className="sales-count">
                        <span className="sales-icon">🔥</span>
                        <span>{totalSold} vendidos</span>
                    </div>
                </div>

                <Link to={`/handpicked/productos/${id}`}>
                    <button className="add-to-cart-btn">
                        Agregar al Carrito
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default BestSellersCard; 