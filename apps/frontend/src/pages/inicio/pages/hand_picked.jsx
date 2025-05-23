import { useParams, Link } from 'react-router-dom';
import { useProduct, useAddToCart } from "@/api/hooks";
import CollapseDetails from "@/pages/inicio/components/collapse";
import LogoLikeLuzimarket from "@/pages/inicio/images/logo_like_luzimarket.png";
import "@/pages/inicio/css/handpicked.css";
import "@/pages/inicio/css/general.css";
import { Card, Button, ButtonGroup, Alert, Container } from "react-bootstrap";
import { useState } from 'react';

const Handpicked = () => {
  const { id } = useParams();
  const { data: fetchedProduct, isLoading, error } = useProduct(id);
  const addToCartMutation = useAddToCart();
  const [addedToCart, setAddedToCart] = useState(false);

  // Loading state
  if (isLoading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading product...</span>
      </div>
    </div>
  );

  // Error state - product not found
  if (error || !fetchedProduct) {
    return (
      <Container className="text-center my-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="product-not-found-container">
              <h1 className="display-4 mb-4">Product Not Found</h1>
              <p className="lead mb-4">
                The product you're looking for doesn't exist or has been removed from our catalog.
              </p>
              <p className="text-muted mb-4">
                This might happen if:
                <ul className="list-unstyled mt-3">
                  <li>• The product has been discontinued</li>
                  <li>• The link is outdated</li>
                  <li>• There was a typo in the URL</li>
                </ul>
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Link to="/handpicked/productos" className="btn btn-primary btn-lg">
                  Browse All Products
                </Link>
                <Link to="/" className="btn btn-outline-secondary btn-lg">
                  Go to Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  // Define fallback product when API returns no data but no error
  const fallbackProduct = {
    id: Number(id),
    name: `Featured Product ${id}`,
    description: 'Product details are currently being updated. Please check back soon.',
    price: 0,
    imageUrl: undefined,
    category: undefined
  };

  const product = fetchedProduct || fallbackProduct;

  const handleAddToCart = () => {
    if (product && fetchedProduct) { // Only allow adding real products to cart
      addToCartMutation.mutate({ productId: product.id, quantity: 1 }, {
        onSuccess: () => {
          setAddedToCart(true);
          setTimeout(() => setAddedToCart(false), 3000);
        }
      });
    }
  };

  const isFallbackProduct = !fetchedProduct;

  return (
    <div className="container product-detail-container">
      {isFallbackProduct && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>Product information unavailable</Alert.Heading>
          This product is currently being updated. Some information may not be accurate.
        </Alert>
      )}

      <div className="row my-4">
        <div className="col-md-6">
          <Card className="border-0">
            <Card.Img
              variant="top"
              src={product.imageUrl || "https://via.placeholder.com/500?text=Product+Image+Coming+Soon"}
              alt={product.name}
              className="product-image"
            />
            <Card.ImgOverlay className="d-flex align-items-start">
              <Card.Img
                src={LogoLikeLuzimarket}
                alt="Logo like"
                style={{ width: "11%" }}
                className="ms-2 mt-2"
              />
            </Card.ImgOverlay>
          </Card>
        </div>
        <div className="col-md-6">
          <h1 className="mb-4 product-title">{product.name}</h1>
          <h5 className="mb-4 text-muted product-category">
            {product.category || "Category"}
          </h5>
          <h3 className="mb-4 product-price">
            ${product.price ? product.price.toFixed(2) : '0.00'}
          </h3>
          <div className="description mb-4">
            <h5>Description:</h5>
            <p className="product-description">
              {product.description || 'Product description will be available soon.'}
            </p>
          </div>

          {!isFallbackProduct ? (
            <div className="d-grid gap-2">
              <Button
                variant="outline-dark"
                size="lg"
                onClick={handleAddToCart}
                className="btn-primary add-to-cart"
                disabled={addToCartMutation.isLoading}
              >
                {addToCartMutation.isLoading ? 'Adding...' : 'Add to Cart'}
              </Button>
              {addedToCart && (
                <Alert variant="success" className="mt-2">
                  ¡Product added to cart!
                </Alert>
              )}
            </div>
          ) : (
            <div className="d-grid gap-2">
              <Button variant="secondary" size="lg" disabled>
                Product Currently Unavailable
              </Button>
              <div className="mt-3">
                <Link to="/handpicked/productos" className="btn btn-primary">
                  Browse Similar Products
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isFallbackProduct && (
        <div className="row my-4 accordion-container">
          <div className="col-md-12">
            <CollapseDetails product={product} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Handpicked;