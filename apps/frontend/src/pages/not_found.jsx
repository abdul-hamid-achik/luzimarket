import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { FaHome, FaArrowLeft, FaSearch } from 'react-icons/fa';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container className="text-center my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-5">
              {/* 404 Error Display */}
              <div className="mb-4">
                <h1 className="display-1 fw-bold text-primary">404</h1>
                <h2 className="h3 mb-3 text-muted">Página no encontrada</h2>
                <p className="lead text-muted">
                  Lo sentimos, la página que buscas no existe o ha sido movida.
                </p>
              </div>

              {/* Navigation Options */}
              <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                <Button
                  as={Link}
                  to="/"
                  variant="primary"
                  size="lg"
                  className="me-md-2"
                >
                  <FaHome className="me-2" />
                  Ir al inicio
                </Button>

                <Button
                  variant="outline-secondary"
                  size="lg"
                  onClick={handleGoBack}
                  className="me-md-2"
                >
                  <FaArrowLeft className="me-2" />
                  Volver atrás
                </Button>

                <Button
                  as={Link}
                  to="/handpicked/productos"
                  variant="outline-primary"
                  size="lg"
                >
                  <FaSearch className="me-2" />
                  Ver productos
                </Button>
              </div>

              {/* Additional Links */}
              <hr className="my-4" />
              <div className="text-muted">
                <p className="mb-2">¿Buscas algo específico? Prueba estos enlaces:</p>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <Link to="/categorias" className="text-decoration-none">
                    Categorías
                  </Link>
                  <Link to="/best-sellers" className="text-decoration-none">
                    Best Sellers
                  </Link>
                  <Link to="/ocasiones" className="text-decoration-none">
                    Ocasiones
                  </Link>
                  <Link to="/editorial" className="text-decoration-none">
                    Editorial
                  </Link>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* SEO and Accessibility */}
      <div className="visually-hidden">
        <h1>Error 404 - Página no encontrada</h1>
        <p>La página solicitada no pudo ser encontrada en nuestro sitio web.</p>
      </div>
    </Container>
  );
};

export default NotFound;
