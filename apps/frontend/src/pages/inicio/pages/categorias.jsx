import React from 'react';
import { useCategories } from "@/api/hooks";
import { Link } from "react-router-dom";
import { FaTags, FaShoppingBag, FaGift, FaHeart, FaHome, FaBirthdayCake } from "react-icons/fa";

// Demo categories with icons for fallback
const demoCategories = [
    {
        id: 1,
        name: 'Flowershop',
        description: 'Hermosas flores y arreglos florales para toda ocasión',
        icon: <FaHeart className="text-danger" />,
        image: 'https://dummyimage.com/300x200/ff6b6b/fff&text=Flowershop'
    },
    {
        id: 2,
        name: 'Sweet',
        description: 'Dulces, pasteles y postres deliciosos',
        icon: <FaBirthdayCake className="text-warning" />,
        image: 'https://dummyimage.com/300x200/feca57/fff&text=Sweet'
    },
    {
        id: 3,
        name: 'Events + Dinners',
        description: 'Todo lo necesario para eventos y cenas especiales',
        icon: <FaGift className="text-success" />,
        image: 'https://dummyimage.com/300x200/48dbfb/fff&text=Events'
    },
    {
        id: 4,
        name: 'Giftshop',
        description: 'Regalos únicos y especiales para sorprender',
        icon: <FaShoppingBag className="text-primary" />,
        image: 'https://dummyimage.com/300x200/0abde3/fff&text=Giftshop'
    },
    {
        id: 5,
        name: 'Home & Living',
        description: 'Decoración y artículos para el hogar',
        icon: <FaHome className="text-info" />,
        image: 'https://dummyimage.com/300x200/778ca3/fff&text=Home'
    },
    {
        id: 6,
        name: 'Fashion',
        description: 'Ropa y accesorios de moda',
        icon: <FaTags className="text-secondary" />,
        image: 'https://dummyimage.com/300x200/c44569/fff&text=Fashion'
    },
];

const Categorias = () => {
    const { data, error, isLoading } = useCategories();
    const categories = (data && data.length) ? data : demoCategories;

    return (
        <div style={{ padding: '2rem 0', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <div className="container">
                {/* Header */}
                <div className="text-center mb-5">
                    <h1 className="display-4 fw-bold mb-3">Nuestras Categorías</h1>
                    <p className="lead text-muted">
                        Explora nuestra amplia selección de productos organizados por categorías
                    </p>
                </div>

                {/* Loading and Error States */}
                {isLoading && (
                    <div className="text-center my-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Cargando categorías...</span>
                        </div>
                        <p className="mt-3">Cargando categorías...</p>
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger text-center">
                        <h5>Error al cargar las categorías</h5>
                        <p>Por favor intenta nuevamente más tarde.</p>
                        <small className="text-muted">Error: {error.message}</small>
                    </div>
                )}

                {/* Categories Grid */}
                {!isLoading && !error && (
                    <div className="row g-4">
                        {categories.map(category => (
                            <div key={category.id} className="col-lg-4 col-md-6">
                                <div className="card h-100 shadow-sm border-0 category-card">
                                    {/* Category Image */}
                                    <div className="position-relative overflow-hidden" style={{ height: '200px' }}>
                                        <img
                                            src={category.image || `https://dummyimage.com/300x200/6c757d/fff&text=${encodeURIComponent(category.name)}`}
                                            alt={category.name}
                                            className="card-img-top w-100 h-100"
                                            style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
                                        />
                                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-25">
                                            <div className="text-white text-center">
                                                <div style={{ fontSize: '3rem' }}>
                                                    {category.icon || <FaTags />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Content */}
                                    <div className="card-body d-flex flex-column">
                                        <h5 className="card-title fw-bold mb-3">{category.name}</h5>
                                        <p className="card-text text-muted flex-grow-1">
                                            {category.description || `Descubre productos increíbles en la categoría ${category.name}`}
                                        </p>

                                        {/* Action Button */}
                                        <div className="mt-auto">
                                            <Link
                                                to={`/categorias/${category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                                                className="btn btn-primary w-100"
                                                style={{ borderRadius: '25px' }}
                                            >
                                                Ver Productos
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && categories.length === 0 && (
                    <div className="text-center my-5">
                        <FaTags size={64} className="text-muted mb-3" />
                        <h3>No hay categorías disponibles</h3>
                        <p className="text-muted">Vuelve pronto para ver nuestras categorías.</p>
                    </div>
                )}

                {/* Call to Action */}
                {!isLoading && !error && categories.length > 0 && (
                    <div className="text-center mt-5 pt-4 border-top">
                        <h4 className="mb-3">¿No encuentras lo que buscas?</h4>
                        <p className="text-muted mb-4">
                            Explora todos nuestros productos o contáctanos para ayudarte
                        </p>
                        <div className="d-flex gap-3 justify-content-center flex-wrap">
                            <Link to="/handpicked/productos" className="btn btn-outline-primary">
                                Ver Todos los Productos
                            </Link>
                            <Link to="/editorial" className="btn btn-outline-secondary">
                                Leer Nuestro Blog
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        .category-card:hover {
          transform: translateY(-5px);
          transition: transform 0.3s ease;
        }
        
        .category-card:hover img {
          transform: scale(1.05);
        }
        
        .category-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .category-card:hover {
          box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
        }
      `}</style>
        </div>
    );
};

export default Categorias; 