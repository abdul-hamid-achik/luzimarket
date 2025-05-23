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

    // Fallback image in case Vercel Blob image fails to load
    const handleImageError = (e) => {
        e.target.src = `https://picsum.photos/seed/${slug}/400/300`;
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