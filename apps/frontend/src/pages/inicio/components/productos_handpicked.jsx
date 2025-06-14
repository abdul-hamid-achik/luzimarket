import { Container, Spinner, Alert, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useProducts, useAddToCart } from "@/api/hooks";
import FavoriteButton from "@/components/ui/favorite_button";
import "@/pages/inicio/css/productos_listing.css";
import { useState } from "react";

const ProductosHandpicked = ({ filters }) => {
  const [sortBy, setSortBy] = useState('relevance');
  
  // Include sortBy in the filters passed to the API
  const apiFilters = {
    ...filters,
    sortBy: sortBy
  };
  
  const { data, isLoading, error } = useProducts(apiFilters);
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
    // Use the imageUrl from API if available - this should be a Vercel Blob URL
    if (product.imageUrl && !imageErrors[product.id]) {
      // If it's a Vercel Blob URL, it should already be complete
      if (product.imageUrl.startsWith('http')) {
        return product.imageUrl;
      }
      // Otherwise, prepend the base URL if needed
      return `${window.location.origin}${product.imageUrl}`;
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
    <div className="products-listing-page">
      <div className="products-header">
        <div className="products-header-content">
          <h1 className="products-title">Hand Picked Products</h1>
          <p className="products-subtitle">
            Productos cuidadosamente seleccionados para momentos especiales
          </p>
        </div>
      </div>

      <Container>
        <div className="results-bar">
          <div className="results-count">
            Mostrando {products.length} productos
          </div>
          <div className="sort-dropdown">
            <label htmlFor="sort">Ordenar por:</label>
            <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="relevance">Más relevantes</option>
              <option value="price-low">Precio: menor a mayor</option>
              <option value="price-high">Precio: mayor a menor</option>
              <option value="newest">Más recientes</option>
            </select>
          </div>
        </div>

        <div className="products-grid-container">
          {products.map((product) => (
            <div key={product.id} className="luxury-product-card">
              <Link
                to={`/handpicked/productos/${product.id}`}
                className="product-link"
                data-testid={`product-${product.id}`}
              >
                <div className="product-image-container">
                  <img
                    src={getImageUrl(product)}
                    alt={product.imageAlt || product.name}
                    className="product-image"
                    onError={(e) => handleImageError(e, product)}
                    loading="lazy"
                  />
                  <div className="quick-view-overlay">
                    <span className="quick-view-text">Vista Rápida</span>
                  </div>
                </div>
              </Link>
              
              <div className="product-badges">
                {product.featured && (
                  <span className="badge badge-featured">Destacado</span>
                )}
              </div>
              
              <div className="favorite-button-container">
                <FavoriteButton
                  productId={product.id}
                  variantId={product.variantId}
                  size="medium"
                  className="favorite-button"
                />
              </div>

              <div className="product-info">
                {product.categoryName && (
                  <div className="product-category">
                    {product.categoryName}
                  </div>
                )}
                
                <h3 className="product-name">
                  <Link to={`/handpicked/productos/${product.id}`}>
                    {product.name}
                  </Link>
                </h3>
                
                <div className="product-rating">
                  <span className="stars">★★★★★</span>
                  <span className="rating-count">(0)</span>
                </div>
                
                <p className="product-description">
                  {product.description || 'Producto único seleccionado especialmente para ti.'}
                </p>
                
                <div className="price-section">
                  <div className="price-container">
                    <span className="current-price">
                      ${(product.price && typeof product.price === 'number') ? (product.price / 100).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  
                  <div className="product-actions">
                    <Link
                      to={`/handpicked/productos/${product.id}`}
                      className="btn-view-details"
                    >
                      Ver Detalles
                    </Link>
                    <button
                      className={`btn-add-to-cart ${addedProducts[product.id] ? 'added' : ''}`}
                      onClick={() => handleAddToCart(product)}
                      disabled={addToCart.isLoading || addedProducts[product.id]}
                    >
                      <span className="cart-icon">
                        {addedProducts[product.id] ? '✓' : '🛒'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              
              {addedProducts[product.id] && (
                <div className="add-to-cart-success">
                  ¡Agregado al carrito!
                </div>
              )}
            </div>
          ))}
        </div>

        {products.length > 0 && (
          <div className="text-center mt-5">
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