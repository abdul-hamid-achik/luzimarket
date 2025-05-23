import { useParams, Link } from 'react-router-dom';
import { useProduct, useAddToCart, usePhotos } from "@/api/hooks";
import CollapseDetails from "@/pages/inicio/components/collapse";
import LogoLikeLuzimarket from "@/pages/inicio/images/logo_like_luzimarket.png";
import "@/pages/inicio/css/handpicked.css";
import "@/pages/inicio/css/general.css";
import { Card, Button, Alert, Container, Carousel, Badge } from "react-bootstrap";
import { useState } from 'react';

const Handpicked = () => {
  const { id } = useParams();
  const { data: fetchedProduct, isLoading, error } = useProduct(id);
  const { data: productPhotos = [] } = usePhotos({ productId: id });
  const addToCartMutation = useAddToCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Loading state
  if (isLoading) return (
    <div className="modern-loading-container">
      <div className="modern-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-text">Loading product...</div>
      </div>
    </div>
  );

  // Error state - product not found
  if (error || !fetchedProduct) {
    return (
      <Container className="modern-error-container">
        <div className="error-content">
          <div className="error-icon">🛍️</div>
          <h1 className="error-title">Product Not Found</h1>
          <p className="error-description">
            The product you're looking for doesn't exist or has been removed from our catalog.
          </p>
          <div className="error-actions">
            <Link to="/handpicked/productos" className="btn-modern btn-primary">
              Browse All Products
            </Link>
            <Link to="/" className="btn-modern btn-secondary">
              Go to Homepage
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  const product = fetchedProduct;

  // Combine product.imageUrl with photos from photos API
  const allPhotos = [];
  if (product.imageUrl) {
    allPhotos.push({ url: product.imageUrl, alt: product.name });
  }
  if (productPhotos && productPhotos.length > 0) {
    allPhotos.push(...productPhotos.map(photo => ({
      url: photo.url,
      alt: photo.alt || product.name
    })));
  }

  // Remove duplicates based on URL
  const uniquePhotos = allPhotos.filter((photo, index, self) =>
    index === self.findIndex(p => p.url === photo.url)
  );

  // Fallback to placeholder if no photos
  const displayPhotos = uniquePhotos.length > 0 ? uniquePhotos : [
    { url: "https://via.placeholder.com/600x600?text=Product+Image+Coming+Soon", alt: product.name }
  ];

  const handleAddToCart = () => {
    addToCartMutation.mutate({ productId: product.id, quantity: 1 }, {
      onSuccess: () => {
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 3000);
      }
    });
  };

  const formatPrice = (price) => {
    return (price && typeof price === 'number') ? (price / 100).toFixed(2) : '0.00';
  };

  return (
    <div className="modern-product-container">
      <Container fluid className="px-0">
        {/* Breadcrumb */}
        <div className="modern-breadcrumb">
          <Container>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                <li className="breadcrumb-item"><Link to="/handpicked/productos">Products</Link></li>
                <li className="breadcrumb-item active">{product.name}</li>
              </ol>
            </nav>
          </Container>
        </div>

        {/* Main Product Section */}
        <Container className="product-main-section">
          <div className="row g-0">
            {/* Photo Gallery */}
            <div className="col-lg-7">
              <div className="photo-gallery-container">
                {/* Main Photo Display */}
                <div className="main-photo-container">
                  <img
                    src={displayPhotos[activePhotoIndex]?.url}
                    alt={displayPhotos[activePhotoIndex]?.alt}
                    className="main-product-photo"
                  />
                  <div className="photo-overlay">
                    <img
                      src={LogoLikeLuzimarket}
                      alt="Luzi Market"
                      className="luzi-watermark"
                    />
                  </div>
                  {displayPhotos.length > 1 && (
                    <div className="photo-navigation">
                      <button
                        className="nav-btn prev-btn"
                        onClick={() => setActivePhotoIndex(prev =>
                          prev === 0 ? displayPhotos.length - 1 : prev - 1
                        )}
                      >
                        ‹
                      </button>
                      <button
                        className="nav-btn next-btn"
                        onClick={() => setActivePhotoIndex(prev =>
                          prev === displayPhotos.length - 1 ? 0 : prev + 1
                        )}
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo Thumbnails */}
                {displayPhotos.length > 1 && (
                  <div className="photo-thumbnails">
                    {displayPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className={`thumbnail ${index === activePhotoIndex ? 'active' : ''}`}
                        onClick={() => setActivePhotoIndex(index)}
                      >
                        <img src={photo.url} alt={photo.alt} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="col-lg-5">
              <div className="product-info-container">
                <div className="product-header">
                  <h1 className="product-title">{product.name}</h1>
                  {product.category && (
                    <Badge bg="light" text="dark" className="category-badge">
                      {product.category}
                    </Badge>
                  )}
                </div>

                <div className="price-section">
                  <span className="price-label">Price</span>
                  <span className="price-value">${formatPrice(product.price)}</span>
                </div>

                <div className="description-section">
                  <h3 className="section-title">Description</h3>
                  <p className="product-description">
                    {product.description || 'Product description will be available soon.'}
                  </p>
                </div>

                <div className="action-section">
                  <Button
                    className="add-to-cart-btn"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isLoading}
                  >
                    {addToCartMutation.isLoading ? (
                      <>
                        <div className="btn-spinner"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <span>Add to Cart</span>
                        <i className="cart-icon">🛒</i>
                      </>
                    )}
                  </Button>

                  {addedToCart && (
                    <Alert variant="success" className="success-alert">
                      <i className="success-icon">✓</i>
                      Product added to cart successfully!
                    </Alert>
                  )}
                </div>

                {/* Product Stats */}
                <div className="product-stats">
                  <div className="stat-item">
                    <span className="stat-label">Photos</span>
                    <span className="stat-value">{displayPhotos.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Product ID</span>
                    <span className="stat-value">{product.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>

        {/* Product Details Collapse */}
        <Container className="details-section">
          <CollapseDetails product={product} />
        </Container>
      </Container>
    </div>
  );
};

export default Handpicked;