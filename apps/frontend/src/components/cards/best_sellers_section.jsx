import React from 'react';
import BestSellersCard from './best_sellers_card';
import { useBestSellers } from '@/api/hooks';
import './best_sellers_section.css';

const BestSellersSection = () => {
    const { data: bestSellers = [], isLoading, error } = useBestSellers();

    if (isLoading) {
        return (
            <div className="best-sellers-section">
                <div className="best-sellers-header">
                    <h2 className="section-title">Los Más Vendidos</h2>
                    <p className="section-subtitle">Los productos favoritos de nuestros clientes</p>
                </div>
                <div className="best-sellers-loading">
                    <div className="loading-grid">
                        {[...Array(4)].map((_, index) => (
                            <div key={index} className="loading-card">
                                <div className="loading-image"></div>
                                <div className="loading-content">
                                    <div className="loading-line short"></div>
                                    <div className="loading-line"></div>
                                    <div className="loading-line medium"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="best-sellers-section">
                <div className="best-sellers-header">
                    <h2 className="section-title">Los Más Vendidos</h2>
                    <p className="section-subtitle">Los productos favoritos de nuestros clientes</p>
                </div>
                <div className="best-sellers-error">
                    <div className="error-content">
                        <div className="error-icon">⚠️</div>
                        <h3>No pudimos cargar los productos más vendidos</h3>
                        <p>Por favor, intenta nuevamente en unos momentos</p>
                        <button
                            className="retry-button"
                            onClick={() => window.location.reload()}
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="best-sellers-section">
            <div className="best-sellers-header">
                <div className="header-content">
                    <h2 className="section-title">
                        <span className="title-icon">🏆</span>
                        Los Más Vendidos
                    </h2>
                    <p className="section-subtitle">
                        Los productos favoritos de nuestros clientes - ¡No te los pierdas!
                    </p>
                </div>
                <div className="header-stats">
                    <span className="stats-badge">Top 10</span>
                </div>
            </div>

            <div className="best-sellers-grid">
                {bestSellers.slice(0, 10).map((product, index) => (
                    <BestSellersCard
                        key={product.id}
                        product={product}
                        rank={index + 1}
                    />
                ))}
            </div>

            {bestSellers.length === 0 && (
                <div className="no-products">
                    <div className="no-products-content">
                        <div className="no-products-icon">📦</div>
                        <h3>Próximamente</h3>
                        <p>Estamos preparando una selección increíble de productos para ti</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BestSellersSection; 