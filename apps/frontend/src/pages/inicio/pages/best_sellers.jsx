import React from 'react';
import BestSellersSection from '@/components/cards/best_sellers_section';
import { Link } from 'react-router-dom';
import '@/pages/inicio/css/general.css';

const BestSellersPage = () => {
    return (
        <div className="cajaBody">
            {/* Header Navigation */}
            <div className="container-fluid bg-light py-3 mb-4">
                <div className="container">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item">
                                <Link to="/" className="text-decoration-none">Inicio</Link>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                Los Más Vendidos
                            </li>
                        </ol>
                    </nav>
                </div>
            </div>

            {/* Page Header */}
            <div className="container mb-5">
                <div className="text-center">
                    <h1 className="display-4 fw-bold mb-3">
                        <span className="me-3">🏆</span>
                        Los Más Vendidos
                    </h1>
                    <p className="lead text-muted mb-4">
                        Descubre los productos favoritos de nuestros clientes. Estos son los regalos que más enamoran y sorprenden.
                    </p>
                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                        <div className="badge bg-primary fs-6 px-3 py-2">
                            ⭐ Productos más populares
                        </div>
                        <div className="badge bg-success fs-6 px-3 py-2">
                            🔥 Actualizado diariamente
                        </div>
                        <div className="badge bg-warning text-dark fs-6 px-3 py-2">
                            💝 Perfectos para regalar
                        </div>
                    </div>
                </div>
            </div>

            {/* Best Sellers Section */}
            <BestSellersSection />

            {/* Additional Information */}
            <div className="container my-5">
                <div className="row">
                    <div className="col-lg-8 mx-auto">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4">
                                <h3 className="card-title text-center mb-4">
                                    ¿Por qué estos productos son los más vendidos?
                                </h3>
                                <div className="row g-4">
                                    <div className="col-md-4 text-center">
                                        <div className="mb-3">
                                            <span className="display-6">⭐</span>
                                        </div>
                                        <h5>Calidad Premium</h5>
                                        <p className="text-muted small">
                                            Productos seleccionados cuidadosamente por su calidad excepcional
                                        </p>
                                    </div>
                                    <div className="col-md-4 text-center">
                                        <div className="mb-3">
                                            <span className="display-6">💝</span>
                                        </div>
                                        <h5>Perfectos para Regalar</h5>
                                        <p className="text-muted small">
                                            Ideales para sorprender en ocasiones especiales y momentos únicos
                                        </p>
                                    </div>
                                    <div className="col-md-4 text-center">
                                        <div className="mb-3">
                                            <span className="display-6">❤️</span>
                                        </div>
                                        <h5>Amor Garantizado</h5>
                                        <p className="text-muted small">
                                            Con miles de clientes satisfechos que recomiendan estos productos
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div className="container my-5">
                <div className="text-center bg-light rounded p-5">
                    <h3 className="mb-3">¿Buscas algo diferente?</h3>
                    <p className="text-muted mb-4">
                        Explora todas nuestras categorías para encontrar el regalo perfecto
                    </p>
                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                        <Link to="/handpicked/productos" className="btn btn-primary btn-lg">
                            Ver Todos los Productos
                        </Link>
                        <Link to="/categorias" className="btn btn-outline-primary btn-lg">
                            Explorar Categorías
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BestSellersPage; 