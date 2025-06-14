import { useParams, Link } from 'react-router-dom';
import { useProduct, useAddToCart, usePhotos } from "@/api/hooks";
import CollapseDetails from "@/pages/inicio/components/collapse";
import "@/css/typography.css";
import "@/pages/inicio/css/product_detail.css";
import { Alert, Container, Badge } from "react-bootstrap";
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
    <div className="product-loading">
      <div className="text-center">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando producto...</div>
      </div>
    </div>
  );

  // Error state - product not found
  if (error || !fetchedProduct) {
    return (
      <div className="product-error">
        <div className="error-container">
          <div className="error-icon">🛍️</div>
          <h1 className="error-heading">Producto No Encontrado</h1>
          <p className="error-text">
            El producto que buscas no existe o ha sido removido de nuestro catálogo.
          </p>
          <div className="error-buttons">
            <Link to="/handpicked/productos" className="btn-error btn-error-primary">
              Ver Todos los Productos
            </Link>
            <Link to="/" className="btn-error btn-error-secondary">
              Ir al Inicio
            </Link>
          </div>
        </div>
      </div>
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
    { url: "https://via.placeholder.com/600x600?text=Imagen+Próximamente", alt: product.name }
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

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % displayPhotos.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

  return (
    <div className="product-detail-page">
      {/* Smart Breadcrumbs */}
      <div className="product-breadcrumbs">
        <div className="breadcrumb-container">
          <Link to="/handpicked/productos" className="breadcrumb-link">
            Productos
          </Link>
          <span className="breadcrumb-separator">›</span>
          {product.category && (
            <>
              <Link to={`/categorias/${product.categorySlug || product.categoryId}`} className="breadcrumb-link">
                {product.category}
              </Link>
              <span className="breadcrumb-separator">›</span>
            </>
          )}
          {product.subcategory && (
            <>
              <Link to={`/categorias/${product.categorySlug}/${product.subcategorySlug}`} className="breadcrumb-link">
                {product.subcategory}
              </Link>
              <span className="breadcrumb-separator">›</span>
            </>
          )}
          <span className="breadcrumb-current">{product.name}</span>
        </div>
      </div>
      {/* Main Product Section */}
      <div className="product-main">
        <div className="product-container">
          <div className="row g-4">
            {/* Product Gallery */}
            <div className="col-lg-7">
              <div className="product-gallery">
                <div className="gallery-main">
                  <img
                    src={displayPhotos[activePhotoIndex]?.url}
                    alt={displayPhotos[activePhotoIndex]?.alt}
                    className="gallery-image"
                  />
                  {displayPhotos.length > 1 && (
                    <div className="gallery-nav">
                      <button className="gallery-nav-btn" onClick={prevPhoto}>
                        ‹
                      </button>
                      <button className="gallery-nav-btn" onClick={nextPhoto}>
                        ›
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {displayPhotos.length > 1 && (
                  <div className="gallery-thumbnails">
                    {displayPhotos.map((photo, index) => (
                      <div
                        key={index}
                        className={`gallery-thumbnail ${index === activePhotoIndex ? 'active' : ''}`}
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
              <div className="product-info">
                <div className="product-info-header">
                  <h1 className="product-name">{product.name}</h1>
                  {product.category && (
                    <span className="product-category-badge">
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="product-price-section">
                  <div className="price-display">
                    <span className="price-label">Precio</span>
                    <span className="price-amount">${formatPrice(product.price)}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="product-description-section">
                  <h3 className="section-heading">Descripción</h3>
                  <p className="product-description-text">
                    {product.description || 'La descripción del producto estará disponible pronto.'}
                  </p>
                </div>

                {/* Delivery Information */}
                {product.delivery_info && (
                  <div className="delivery-info">
                    <h3 className="section-heading">Disponibilidad de Entrega</h3>
                    {product.delivery_info.user_delivery_zone ? (
                      <div>
                        <div className={`delivery-badge ${product.delivery_info.is_available_in_user_zone ? 'available' : 'not-available'}`}>
                          {product.delivery_info.is_available_in_user_zone ? (
                            <>✓ Disponible en {product.delivery_info.user_delivery_zone.name}</>
                          ) : (
                            <>✕ No disponible en {product.delivery_info.user_delivery_zone.name}</>
                          )}
                        </div>
                        {product.delivery_info.user_delivery_zone && (
                          <p className="delivery-fee">
                            Costo de envío: ${(product.delivery_info.user_delivery_zone.fee / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted">
                        Por favor selecciona tu zona de entrega para verificar disponibilidad
                      </p>
                    )}

                    {product.delivery_info.available_zones.length > 0 && (
                      <div className="delivery-zones">
                        <h4 className="zones-title">Disponible en estas áreas:</h4>
                        <div className="zones-list">
                          {product.delivery_info.available_zones.map(zone => (
                            <span key={zone.id} className="zone-tag">
                              {zone.name} (${(zone.fee / 100).toFixed(2)})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Add to Cart */}
                <div className="product-actions">
                  <button
                    className="btn-add-to-cart"
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isLoading}
                  >
                    {addToCartMutation.isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm"></span>
                        Agregando...
                      </>
                    ) : (
                      <>
                        Agregar al Carrito
                        <span className="cart-icon">🛒</span>
                      </>
                    )}
                  </button>

                  {addedToCart && (
                    <Alert variant="success" className="add-to-cart-success">
                      ¡Producto agregado al carrito exitosamente!
                    </Alert>
                  )}
                </div>

                {/* Product Meta */}
                <div className="product-meta">
                  <div className="meta-item">
                    <span className="meta-label">Fotos</span>
                    <span className="meta-value">{displayPhotos.length}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">ID del Producto</span>
                    <span className="meta-value">{product.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="product-details">
        <div className="details-header">
          <h2 className="details-title">Detalles del Producto</h2>
          <p className="details-subtitle">Información completa sobre este producto</p>
        </div>
        <CollapseDetails product={product} />
      </div>
    </div>
  );
};

export default Handpicked;