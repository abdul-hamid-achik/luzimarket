import React from 'react';
import { useBestSellers } from '@/api/hooks';
import { Link } from 'react-router-dom';
import '@/pages/inicio/css/best_sellers.css';

const BestSellersPage = () => {
    const { data: bestSellers = [], isLoading, error } = useBestSellers();

    const formatPrice = (price) => {
        return (price && typeof price === 'number') ? (price / 100).toFixed(2) : '0.00';
    };

    return (
        <div className="best-sellers-page">
            {/* Page Header */}
            <div className="best-sellers-header">
                <div className="container">
                    <h1 className="best-sellers-title">
                        Los Más Vendidos
                    </h1>
                    <p className="best-sellers-subtitle">
                        Descubre nuestros productos más populares elegidos por miles de clientes
                    </p>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="best-sellers-container">
                    <div className="container">
                        <div className="best-sellers-loading">
                            <div className="loading-spinner"></div>
                            <p className="loading-text">Cargando productos...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="best-sellers-container">
                    <div className="container">
                        <div className="best-sellers-error">
                            <div className="error-icon">⚠️</div>
                            <h2 className="error-title">Error al cargar productos</h2>
                            <p className="error-message">Por favor intenta de nuevo más tarde</p>
                            <button
                                className="btn-cta btn-cta-primary"
                                onClick={() => window.location.reload()}
                            >
                                Reintentar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            {!isLoading && !error && bestSellers.length > 0 && (
                <div className="best-sellers-container">
                    <div className="container">
                        <div className="best-sellers-grid">
                            {bestSellers.map((product, index) => (
                                <div key={product.id} className="best-seller-card">
                                    <div className="best-seller-rank">#{index + 1}</div>
                                    <Link to={`/handpicked/productos/${product.id}`}>
                                        <div className="best-seller-image">
                                            <img
                                                src={product.imageUrl || 'https://via.placeholder.com/400x400?text=Sin+Imagen'}
                                                alt={product.imageAlt || product.name}
                                            />
                                        </div>
                                    </Link>
                                    <div className="best-seller-content">
                                        <h3 className="best-seller-name">
                                            <Link to={`/handpicked/productos/${product.id}`}>
                                                {product.name}
                                            </Link>
                                        </h3>
                                        <p className="best-seller-category">{product.categoryName}</p>
                                        <div className="best-seller-price">${formatPrice(product.price)}</div>
                                        <div className="best-seller-sold">
                                            {product.totalSold} vendidos
                                        </div>
                                        <Link
                                            to={`/handpicked/productos/${product.id}`}
                                            className="best-seller-button"
                                        >
                                            Ver Producto
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && bestSellers.length === 0 && (
                <div className="best-sellers-container">
                    <div className="container">
                        <div className="best-sellers-empty">
                            <div className="empty-icon">📦</div>
                            <h2 className="empty-title">No hay productos más vendidos disponibles por el momento.</h2>
                            <p className="empty-message">Vuelve pronto para ver nuestros productos favoritos</p>
                            <Link to="/handpicked/productos" className="btn-cta btn-cta-primary">
                                Ver Todos los Productos
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Information Section */}
            <div className="best-sellers-info">
                <div className="container">
                    <div className="info-card">
                        <h3 className="info-title">
                            Por Qué los Clientes Aman Estos Productos
                        </h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-icon">✓</span>
                                <h5 className="info-heading">Calidad Asegurada</h5>
                                <p className="info-text">
                                    Cada producto es cuidadosamente seleccionado por su calidad excepcional
                                </p>
                            </div>
                            <div className="info-item">
                                <span className="info-icon">⭐</span>
                                <h5 className="info-heading">Altamente Calificados</h5>
                                <p className="info-text">
                                    Calificados consistentemente con 5 estrellas por nuestros clientes satisfechos
                                </p>
                            </div>
                            <div className="info-item">
                                <span className="info-icon">❤️</span>
                                <h5 className="info-heading">Regalos Perfectos</h5>
                                <p className="info-text">
                                    Ideales para ocasiones especiales y momentos memorables
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="best-sellers-cta">
                <div className="container">
                    <div className="cta-box">
                        <h3 className="cta-title">¿Buscas Algo Específico?</h3>
                        <p className="cta-text">
                            Explora nuestro catálogo completo para encontrar el producto perfecto
                        </p>
                        <div className="cta-buttons">
                            <Link to="/handpicked/productos" className="btn-cta btn-cta-primary">
                                Ver Todos los Productos
                            </Link>
                            <Link to="/categorias" className="btn-cta btn-cta-outline">
                                Explorar Categorías
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BestSellersPage;