import React from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useBestSellers } from '@/api/hooks';
import ModernBestSellersCard from '@/components/cards/modern_best_sellers_card';
import './modern_best_sellers.css';

const ModernBestSellersPage = () => {
  const { data, isLoading, error } = useBestSellers({ limit: 20 });
  const products = data?.products || [];

  if (isLoading) {
    return (
      <div className="page-loading">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading best sellers...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          Failed to load best sellers. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <div className="modern-bestsellers-page">
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <Container>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item active">
                Best Sellers
              </li>
            </ol>
          </nav>
        </Container>
      </div>

      {/* Page Header */}
      <Container className="page-header">
        <h1>Best Sellers</h1>
        <p className="lead">
          Discover our most popular products chosen by thousands of customers
        </p>
      </Container>

      {/* Products Grid */}
      <Container className="products-section">
        <Row className="g-4">
          {products.map((product, index) => (
            <Col key={product.id} xs={12} sm={6} md={4} lg={3}>
              <ModernBestSellersCard 
                product={product} 
                rank={index + 1}
              />
            </Col>
          ))}
        </Row>

        {products.length === 0 && (
          <div className="no-products">
            <p>No best sellers available at the moment.</p>
            <Link to="/handpicked/productos" className="btn btn-primary">
              Browse All Products
            </Link>
          </div>
        )}
      </Container>

      {/* Why Best Sellers Section */}
      <div className="why-bestsellers-section">
        <Container>
          <h2 className="text-center mb-5">Why Customers Love These Products</h2>
          <Row className="g-4">
            <Col md={4} className="text-center">
              <div className="feature-icon">✓</div>
              <h4>Quality Assured</h4>
              <p className="text-muted">
                Each product is carefully selected for exceptional quality
              </p>
            </Col>
            <Col md={4} className="text-center">
              <div className="feature-icon">★</div>
              <h4>Highly Rated</h4>
              <p className="text-muted">
                Consistently rated 5 stars by our satisfied customers
              </p>
            </Col>
            <Col md={4} className="text-center">
              <div className="feature-icon">♥</div>
              <h4>Perfect Gifts</h4>
              <p className="text-muted">
                Ideal for special occasions and memorable moments
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <Container className="text-center">
          <h3>Looking for Something Specific?</h3>
          <p className="mb-4">
            Explore our full catalog to find the perfect product
          </p>
          <div className="cta-buttons">
            <Link to="/handpicked/productos" className="btn btn-primary btn-lg">
              View All Products
            </Link>
            <Link to="/categorias" className="btn btn-outline-primary btn-lg">
              Browse Categories
            </Link>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default ModernBestSellersPage;