import React, { useState, useEffect } from 'react';
import { useHomepageSlides } from '@/api/hooks';
import './luxury_hero_carousel.css';

const LuxuryHeroCarousel = () => {
    const { data: slides = [], isLoading, error } = useHomepageSlides();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Auto-advance slides
    useEffect(() => {
        if (!isAutoPlaying || slides.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(timer);
    }, [isAutoPlaying, slides.length]);

    // Handle manual navigation
    const goToSlide = (index) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        // Resume autoplay after 10 seconds
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    if (isLoading) {
        return (
            <div className="luxury-hero-carousel">
                <div className="carousel-loading">
                    <div className="loading-skeleton"></div>
                </div>
            </div>
        );
    }

    if (error || slides.length === 0) {
        return (
            <div className="luxury-hero-carousel">
                <div className="carousel-placeholder">
                    <div className="placeholder-content">
                        <h2>Bienvenido a LUZI<span className="luxury-symbol">®</span>MARKET</h2>
                        <p>Regalos excepcionales para momentos especiales</p>
                    </div>
                </div>
            </div>
        );
    }

    const currentSlideData = slides[currentSlide];

    return (
        <div className="luxury-hero-carousel">
            <div className="carousel-container">
                {/* Main slide display */}
                <div className="slide-wrapper">
                    <div
                        className="slide-background"
                        style={{
                            backgroundImage: `url(${currentSlideData.imageUrl})`,
                            backgroundColor: currentSlideData.backgroundColor
                        }}
                    >
                        <div className="slide-overlay"></div>
                    </div>

                    <div className={`slide-content slide-content-${currentSlideData.position}`}>
                        <div
                            className="content-wrapper"
                            style={{ color: currentSlideData.textColor }}
                        >
                            <h1 className="slide-title">{currentSlideData.title}</h1>
                            {currentSlideData.subtitle && (
                                <h2 className="slide-subtitle">{currentSlideData.subtitle}</h2>
                            )}
                            {currentSlideData.description && (
                                <p className="slide-description">{currentSlideData.description}</p>
                            )}
                            {currentSlideData.buttonText && currentSlideData.buttonLink && (
                                <a
                                    href={currentSlideData.buttonLink}
                                    className="slide-button"
                                    style={{
                                        borderColor: currentSlideData.textColor,
                                        color: currentSlideData.textColor
                                    }}
                                >
                                    {currentSlideData.buttonText}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation arrows */}
                {slides.length > 1 && (
                    <>
                        <button
                            className="carousel-nav carousel-nav-prev"
                            onClick={prevSlide}
                            aria-label="Previous slide"
                            data-testid="hero-carousel-prev"
                        >
                            ‹
                        </button>
                        <button
                            className="carousel-nav carousel-nav-next"
                            onClick={nextSlide}
                            aria-label="Next slide"
                            data-testid="hero-carousel-next"
                        >
                            ›
                        </button>
                    </>
                )}

                {/* Slide indicators */}
                {slides.length > 1 && (
                    <div className="carousel-indicators">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                className={`indicator ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => goToSlide(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Progress bar */}
                {slides.length > 1 && isAutoPlaying && (
                    <div className="carousel-progress">
                        <div
                            className="progress-bar"
                            style={{
                                animation: 'progressBar 5s linear infinite'
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LuxuryHeroCarousel; 