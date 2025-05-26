import React, { useState, useRef, useEffect } from 'react';
import { useBestSellers } from '@/api/hooks';
import { Link } from 'react-router-dom';
import './luxury_best_sellers_carousel.css';

const LuxuryBestSellersCarousel = () => {
    const { data: bestSellers = [], isLoading, error } = useBestSellers();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const carouselRef = useRef(null);
    const [cardWidth, setCardWidth] = useState(260);
    const [visibleCards, setVisibleCards] = useState(5);

    // Improved image error handling
    const handleImageError = (e, productName, productSlug) => {
        const img = e.target;
        const currentSrc = img.src;

        // Try different fallback images in sequence
        const fallbackImages = [
            `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&auto=format`,
            `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&auto=format`,
            `https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&auto=format`,
            `https://picsum.photos/seed/${productSlug}/400/300`,
            `https://via.placeholder.com/400x300/f8f9fa/6c757d?text=${encodeURIComponent(productName.substring(0, 20))}`
        ];

        // Find the next fallback that hasn't been tried yet
        const currentIndex = fallbackImages.findIndex(url => currentSrc.includes(url.split('?')[0]));
        const nextIndex = currentIndex + 1;

        if (nextIndex < fallbackImages.length) {
            img.src = fallbackImages[nextIndex];
        }
    };

    // Calculate card dimensions and visible cards based on screen size
    useEffect(() => {
        const calculateDimensions = () => {
            const screenWidth = window.innerWidth;
            if (screenWidth >= 1200) {
                setVisibleCards(6);
                setCardWidth(180);
            } else if (screenWidth >= 768) {
                setVisibleCards(4);
                setCardWidth(160);
            } else if (screenWidth >= 480) {
                setVisibleCards(2);
                setCardWidth(140);
            } else {
                setVisibleCards(1);
                setCardWidth(Math.min(160, screenWidth - 40)); // Responsive width with 20px margin on each side
            }
        };

        calculateDimensions();
        window.addEventListener('resize', calculateDimensions);
        return () => window.removeEventListener('resize', calculateDimensions);
    }, []);

    // Auto-advance carousel
    useEffect(() => {
        if (!isAutoPlaying || bestSellers.length <= visibleCards) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => {
                const maxIndex = Math.max(0, bestSellers.length - visibleCards);
                return prev >= maxIndex ? 0 : prev + 1;
            });
        }, 4000);

        return () => clearInterval(timer);
    }, [isAutoPlaying, bestSellers.length, visibleCards]);

    const handleNext = () => {
        const maxIndex = Math.max(0, bestSellers.length - visibleCards);
        setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 8000);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 8000);
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 8000);
    };

    if (isLoading) {
        return (
            <div className="luxury-bestsellers-section">
                <div className="section-header">
                    <h2 className="section-title">Los Más Vendidos</h2>
                    <p className="section-subtitle">Cargando productos...</p>
                </div>
                <div className="carousel-loading">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="product-card-skeleton">
                            <div className="skeleton-image"></div>
                            <div className="skeleton-content">
                                <div className="skeleton-line short"></div>
                                <div className="skeleton-line"></div>
                                <div className="skeleton-line medium"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || bestSellers.length === 0) {
        return (
            <div className="luxury-bestsellers-section">
                <div className="section-header">
                    <h2 className="section-title">Los Más Vendidos</h2>
                    <p className="section-subtitle">Próximamente productos increíbles</p>
                </div>
            </div>
        );
    }

    const translateX = -(currentIndex * (cardWidth + 24)); // 24px gap

    return (
        <div className="luxury-bestsellers-section">
            <div className="section-header">
                <div className="header-content">
                    <h2 className="section-title">
                        <span className="title-icon">🏆</span>
                        Los Más Vendidos
                    </h2>
                    <p className="section-subtitle">
                        Los favoritos de nuestros clientes - ¡No te los pierdas!
                    </p>
                </div>
                <div className="header-actions">
                    <Link to="/best-sellers" className="view-all-btn">
                        Ver Todos
                    </Link>
                </div>
            </div>

            <div className="carousel-container">
                <div
                    className="carousel-track"
                    ref={carouselRef}
                    style={{
                        transform: `translateX(${translateX}px)`,
                        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    {bestSellers.map((product, index) => (
                        <div
                            key={product.id}
                            className="product-card"
                            style={{ minWidth: `${cardWidth}px` }}
                        >
                            <div className="card-inner">
                                <div className="product-rank">
                                    #{index + 1}
                                </div>

                                <Link to={`/handpicked/productos/${product.id}`} className="product-image-link">
                                    <div className="product-image">
                                        <img
                                            src={product.imageUrl || '/placeholder-product.jpg'}
                                            alt={product.name}
                                            loading="lazy"
                                            onError={(e) => handleImageError(e, product.name, product.slug)}
                                        />
                                        <div className="image-overlay">
                                            <span className="view-product">Ver Producto</span>
                                        </div>
                                    </div>
                                </Link>

                                <div className="product-info">
                                    <div className="product-category">
                                        {product.categoryName || 'Producto'}
                                    </div>

                                    <h3 className="product-title">
                                        <Link to={`/handpicked/productos/${product.id}`}>
                                            {product.name}
                                        </Link>
                                    </h3>

                                    <p className="product-description">
                                        {product.description?.length > 100
                                            ? `${product.description.substring(0, 100)}...`
                                            : product.description
                                        }
                                    </p>

                                    <div className="product-stats">
                                        <div className="product-price">
                                            ${(product.price / 100).toFixed(2)}
                                        </div>
                                        <div className="product-sales">
                                            {product.totalSold || 0} vendidos
                                        </div>
                                    </div>

                                    <Link
                                        to={`/handpicked/productos/${product.id}`}
                                        className="add-to-cart-btn"
                                    >
                                        Ver Detalles
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation arrows */}
                {bestSellers.length > visibleCards && (
                    <>
                        <button
                            className={`carousel-nav carousel-nav-prev ${currentIndex === 0 ? 'disabled' : ''}`}
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            aria-label="Previous products"
                            data-testid="bestsellers-carousel-prev"
                        >
                            ‹
                        </button>
                        <button
                            className={`carousel-nav carousel-nav-next ${currentIndex >= bestSellers.length - visibleCards ? 'disabled' : ''}`}
                            onClick={handleNext}
                            disabled={currentIndex >= bestSellers.length - visibleCards}
                            aria-label="Next products"
                            data-testid="bestsellers-carousel-next"
                        >
                            ›
                        </button>
                    </>
                )}

                {/* Pagination dots */}
                {bestSellers.length > visibleCards && (
                    <div className="carousel-pagination">
                        {Array.from({ length: Math.ceil((bestSellers.length - visibleCards + 1)) }, (_, index) => (
                            <button
                                key={index}
                                className={`pagination-dot ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => goToSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LuxuryBestSellersCarousel; 