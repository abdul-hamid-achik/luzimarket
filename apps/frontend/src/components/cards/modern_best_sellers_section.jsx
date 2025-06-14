import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { useBestSellers } from "@/api/hooks";
import ModernBestSellersCard from "./modern_best_sellers_card";
import "./modern_best_sellers_section.css";

const ModernBestSellersSection = ({ limit = 10 }) => {
  const { data, isLoading, error } = useBestSellers({ limit });
  const products = data?.products || [];

  if (isLoading) {
    return (
      <div className="bestsellers-loading">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading best sellers...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">
          Failed to load best sellers. Please try again later.
        </Alert>
      </Container>
    );
  }

  if (!products.length) {
    return null;
  }

  return (
    <section className="modern-bestsellers-section">
      <Container>
        <div className="section-header">
          <h2 className="section-title">Best Sellers</h2>
          <p className="section-subtitle">Our most popular products this month</p>
        </div>

        <Row className="g-4">
          {products.slice(0, limit).map((product, index) => (
            <Col key={product.id} xs={12} sm={6} md={4} lg={3}>
              <ModernBestSellersCard 
                product={product} 
                rank={index + 1}
              />
            </Col>
          ))}
        </Row>

        <div className="section-footer">
          <Link to="/best-sellers">
            <Button variant="outline-primary" size="lg" className="view-all-btn">
              View All Best Sellers
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
};

ModernBestSellersSection.propTypes = {
  limit: PropTypes.number,
};

export default ModernBestSellersSection;