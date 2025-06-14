import React from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useBestSellers } from '@/api/hooks';
import ModernBestSellersCard from '@/components/cards/modern_best_sellers_card';
import './modern_best_sellers.css';

const ModernBestSellersPage = () => {
  const { data: products = [], isLoading, error } = useBestSellers({ limit: 5 });

  if (isLoading) {
    return (
      <div className="page-loading">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando más vendidos...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          Error al cargar los más vendidos. Por favor intenta de nuevo más tarde.
        </Alert>
      </Container>
    );
  }

  return (
    <div className="modern-bestsellers-page">

      {/* Page Header */}
      <Container className="page-header">
        <h1>Los Más Vendidos</h1>
        <p className="lead">
          Descubre nuestros productos más populares elegidos por miles de clientes
        </p>
      </Container>

      {/* Products Grid */}
      <Container className="products-section">
        <div className="best-sellers-showcase">
          {products.map((product, index) => (
            <div key={product.id} className="showcase-item">
              <div className="showcase-rank">{index + 1}</div>
              <Link to={`/handpicked/productos/${product.id}`} className="showcase-link">
                <div className="showcase-image">
                  <img 
                    src={product.imageUrl || 'https://via.placeholder.com/400x400?text=Sin+Imagen'} 
                    alt={product.imageAlt || product.name}
                  />
                </div>
                <div className="showcase-content">
                  <h3 className="showcase-title">{product.name}</h3>
                  <p className="showcase-category">{product.categoryName}</p>
                  <div className="showcase-price">${(product.price / 100).toFixed(2)}</div>
                  <div className="showcase-sold">{product.totalSold} vendidos</div>
                  <button className="showcase-button">
                    Ver Producto
                  </button>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="no-products">
            <p>No hay productos más vendidos disponibles por el momento.</p>
            <Link to="/handpicked/productos" className="btn btn-primary btn-black">
              Ver Todos los Productos
            </Link>
          </div>
        )}
      </Container>

      {/* Why Best Sellers Section */}
      <div className="why-bestsellers-section">
        <Container>
          <h2 className="text-center mb-5">Por Qué los Clientes Aman Estos Productos</h2>
          <Row className="g-4">
            <Col md={4} className="text-center">
              <div className="feature-icon">✓</div>
              <h4>Calidad Asegurada</h4>
              <p className="text-muted">
                Cada producto es cuidadosamente seleccionado por su calidad excepcional
              </p>
            </Col>
            <Col md={4} className="text-center">
              <div className="feature-icon">★</div>
              <h4>Altamente Calificados</h4>
              <p className="text-muted">
                Calificados consistentemente con 5 estrellas por nuestros clientes satisfechos
              </p>
            </Col>
            <Col md={4} className="text-center">
              <div className="feature-icon">♥</div>
              <h4>Regalos Perfectos</h4>
              <p className="text-muted">
                Ideales para ocasiones especiales y momentos memorables
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <Container className="text-center">
          <h3>¿Buscas Algo Específico?</h3>
          <p className="mb-4">
            Explora nuestro catálogo completo para encontrar el producto perfecto
          </p>
          <div className="cta-buttons">
            <Link to="/handpicked/productos" className="btn btn-primary btn-lg btn-black">
              Ver Todos los Productos
            </Link>
            <Link to="/categorias" className="btn btn-outline-primary btn-lg btn-outline-black">
              Explorar Categorías
            </Link>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default ModernBestSellersPage;