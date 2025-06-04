import { Card, Container, Spinner, Alert, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useProducts, useAddToCart } from "@/api/hooks";
import FavoriteButton from "@/components/ui/favorite_button";
import "@/pages/inicio/css/handpicked.css";
import { useState } from "react";

const ProductosHandpicked = ({ filters }) => {
  const { data, isLoading, error } = useProducts(filters);
  const addToCart = useAddToCart();
  const [addedProducts, setAddedProducts] = useState({});
  const [imageErrors, setImageErrors] = useState({});
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

  // Enhanced image error handling with multiple fallbacks
  const handleImageError = (e, product) => {
    const img = e.target;
    const currentSrc = img.src;

    // Track error for this product
    setImageErrors(prev => ({ ...prev, [product.id]: true }));

    // Fallback image chain in order of preference
    const fallbackImages = [
      // Try product image URL with different formats
      product.imageUrl,
      // High-quality stock images related to gifts/flowers
      `https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop&auto=format&q=80`, // Gift box
      `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop&auto=format&q=80`, // Flowers
      `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&auto=format&q=80`, // Store/shopping
      `https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&auto=format&q=80`, // Shopping bag
      // Picsum as backup with product-specific seed
      `https://picsum.photos/seed/${product.slug || product.id}/400/400`,
      // Final fallback with product name
      `https://via.placeholder.com/400x400/f8f9fa/6c757d?text=${encodeURIComponent(product.name.substring(0, 20))}`
    ].filter(Boolean); // Remove any undefined values

    // Find current position in fallback chain
    const currentIndex = fallbackImages.findIndex(url => {
      if (!url) return false;
      // Extract base URL without query parameters for comparison
      const baseUrl = url.split('?')[0];
      return currentSrc.includes(baseUrl) || currentSrc === url;
    });

    const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 1;

    // If we have more fallbacks, try the next one
    if (nextIndex < fallbackImages.length) {
      console.log(`Image error for product ${product.id}, trying fallback ${nextIndex + 1}/${fallbackImages.length}`);
      img.src = fallbackImages[nextIndex];
    } else {
      console.warn(`All image fallbacks failed for product ${product.id}`);
    }
  };

  // Get optimized image URL for a product
  const getImageUrl = (product) => {
    if (product.imageUrl && !imageErrors[product.id]) {
      return product.imageUrl;
    }

    // Default to first fallback
    return `https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=400&fit=crop&auto=format&q=80`;
  };

  if (isLoading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading products...</span>
        </Spinner>
        <p className="mt-3 text-muted">Cargando productos increíbles...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">
          <Alert.Heading>Error cargando productos</Alert.Heading>
          <p>
            Lo sentimos, hubo un problema al cargar los productos.
            Por favor intenta de nuevo más tarde.
          </p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button
              onClick={() => window.location.reload()}
              variant="outline-danger"
            >
              Reintentar
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (products.length === 0) {
    return (
      <Container className="my-5 text-center">
        <Alert variant="info" className="border-0 bg-light">
          <div className="mb-3">
            <span style={{ fontSize: '3rem' }}>🎁</span>
          </div>
          <Alert.Heading>¡Productos increíbles muy pronto!</Alert.Heading>
          <p className="mb-4">
            Estamos preparando una selección especial de productos únicos para ti.
            Vuelve pronto para descubrir regalos extraordinarios.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <Link to="/" className="btn btn-primary">
              Ir al Inicio
            </Link>
            <Link to="/categorias" className="btn btn-outline-primary">
              Ver Categorías
            </Link>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="featured-products-container">
      <Container>
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold mb-3">
            <span className="me-3">✨</span>
            Hand Picked Products
          </h1>
          <p className="lead text-muted">
            Productos cuidadosamente seleccionados para momentos especiales
          </p>
        </div>

        <div className="cajaTodosLosProductos row g-4">
          {products.map((product) => (
            <div key={product.id} className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
              <Card className="product-card h-100 border-0 shadow-sm">
                <Link
                  to={`/handpicked/productos/${product.id}`}
                  className="product-link"
                  data-testid={`product-${product.id}`}
                >
                  <div className="position-relative overflow-hidden">
                    <Card.Img
                      variant="top"
                      src={getImageUrl(product)}
                      alt={product.name}
                      className="product-image"
                      style={{
                        height: '250px',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                      onError={(e) => handleImageError(e, product)}
                      loading="lazy"
                    />
                    <div className="position-absolute top-0 end-0 p-2">
                      {product.featured && (
                        <span className="badge bg-warning text-dark">
                          ⭐ Destacado
                        </span>
                      )}
                    </div>
                    <div className="position-absolute top-0 start-0 p-2">
                      <FavoriteButton
                        productId={product.id}
                        variantId={product.variantId}
                        size="medium"
                      />
                    </div>
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                      style={{
                        background: 'rgba(0,0,0,0.7)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                      onMouseLeave={(e) => e.target.style.opacity = 0}
                    >
                      <span className="text-white fw-bold">Ver Detalles</span>
                    </div>
                  </div>
                </Link>
                <Card.Body className="d-flex flex-column">
                  <div className="mb-2">
                    {product.categoryName && (
                      <small className="text-muted text-uppercase fw-bold">
                        {product.categoryName}
                      </small>
                    )}
                  </div>
                  <Card.Title className="product-title h5 mb-3">
                    <Link
                      to={`/handpicked/productos/${product.id}`}
                      className="text-decoration-none text-dark"
                    >
                      {product.name}
                    </Link>
                  </Card.Title>
                  <Card.Text className="product-description text-muted flex-grow-1">
                    {product.description || 'Producto único seleccionado especialmente para ti.'}
                  </Card.Text>
                  <div className="mt-auto">
                    <Card.Text className="product-price h4 mb-3 text-primary fw-bold">
                      ${(product.price && typeof product.price === 'number') ? (product.price / 100).toFixed(2) : '0.00'}
                    </Card.Text>
                    <div className="d-flex gap-2">
                      <Link
                        to={`/handpicked/productos/${product.id}`}
                        className="btn btn-outline-dark flex-grow-1 view-details-btn"
                      >
                        Ver Detalles
                      </Link>
                      <Button
                        variant="primary"
                        className="add-to-cart"
                        onClick={() => handleAddToCart(product)}
                        disabled={addToCart.isLoading || addedProducts[product.id]}
                      >
                        {addedProducts[product.id] ? '✓' : '🛒'}
                      </Button>
                    </div>
                    {addedProducts[product.id] && (
                      <div className="text-success mt-2 text-center small">
                        ¡Agregado al carrito!
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>

        {products.length > 0 && (
          <div className="text-center mt-5">
            <p className="text-muted mb-3">
              Mostrando {products.length} productos
            </p>
            <Link to="/categorias" className="btn btn-outline-primary">
              Explorar más categorías
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
};

export default ProductosHandpicked;