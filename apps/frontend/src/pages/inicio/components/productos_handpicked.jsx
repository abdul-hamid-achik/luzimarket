import { Card, Container, Spinner, Alert, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useProducts, useAddToCart } from "@/api/hooks";
import "@/pages/inicio/css/handpicked.css";
import { useState } from "react";

const ProductosHandpicked = ({ filters }) => {
  const { data, isLoading, error } = useProducts(filters);
  const addToCart = useAddToCart();
  const [addedProducts, setAddedProducts] = useState({});
  const products = data?.products || [];

  const handleAddToCart = (product) => {
    addToCart.mutate({ productId: product.id, quantity: 1 }, {
      onSuccess: () => {
        // Show temporary success message
        setAddedProducts(prev => ({ ...prev, [product.id]: true }));
        setTimeout(() => {
          setAddedProducts(prev => ({ ...prev, [product.id]: false }));
        }, 3000);
      }
    });
  };

  if (isLoading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading products...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          Error loading products. Please try again later.
        </Alert>
      </Container>
    );
  }

  if (products.length === 0) {
    return (
      <Container className="my-5 text-center">
        <Alert variant="info">
          <h4>No products available</h4>
          <p>We're currently updating our product catalog. Please check back soon!</p>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="featured-products-container">
      <Container>
        <h1 className="text-center mb-4">Hand Picked Products</h1>

        <div className="cajaTodosLosProductos row g-4">
          {products.map((product) => (
            <div key={product.id} className="col-12 col-sm-6 col-md-6 col-lg-4">
              <Card className="product-card h-100">
                <Link
                  to={`/handpicked/productos/${product.id}`}
                  className="product-link"
                  data-testid={`product-${product.id}`}
                >
                  <Card.Img
                    variant="top"
                    src={product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}
                    alt={product.name}
                    className="product-image"
                  />
                </Link>
                <Card.Body>
                  <Card.Title className="product-title">{product.name}</Card.Title>
                  <Card.Text className="product-description">{product.description}</Card.Text>
                  <Card.Text className="product-price">
                    ${(product.price && typeof product.price === 'number') ? (product.price / 100).toFixed(2) : '0.00'}
                  </Card.Text>
                  <div className="d-flex justify-content-between">
                    <Link
                      to={`/handpicked/productos/${product.id}`}
                      className="btn btn-outline-dark mt-2 view-details-btn"
                    >
                      Ver Detalles
                    </Link>
                    <Button
                      variant="primary"
                      className="mt-2 add-to-cart"
                      onClick={() => handleAddToCart(product)}
                      disabled={addToCart.isLoading || addedProducts[product.id]}
                    >
                      {addedProducts[product.id] ? '✓ Agregado' : 'Agregar'}
                    </Button>
                  </div>
                  {addedProducts[product.id] && (
                    <div className="text-success mt-2 text-center">
                      ¡Producto agregado al carrito!
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default ProductosHandpicked;