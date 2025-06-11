import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useState } from "react";
import FavoriteButton from "@/components/ui/favorite_button";
import { useAddToCart } from "@/api/hooks";
import "./modern_best_sellers_card.css";

const ModernBestSellersCard = ({ product, rank }) => {
  const addToCart = useAddToCart();
  const [isAdded, setIsAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart.mutate({ productId: product.id, quantity: 1 }, {
      onSuccess: () => {
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
      }
    });
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? (price / 100).toFixed(2) : '0.00';
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const imageUrl = imageError || !product.imageUrl 
    ? `https://via.placeholder.com/300x300/f8f9fa/6c757d?text=${encodeURIComponent(product.name.substring(0, 20))}`
    : product.imageUrl;

  return (
    <Card className="modern-bestseller-card">
      {rank <= 3 && (
        <div className="bestseller-badge">
          #{rank} Best Seller
        </div>
      )}
      
      <Link to={`/handpicked/productos/${product.id}`} className="product-link">
        <div className="product-image-container">
          <img
            src={imageUrl}
            alt={product.name}
            className="product-image"
            onError={handleImageError}
          />
          <div className="product-overlay">
            <Button 
              variant="light" 
              className="quick-view-btn"
              onClick={(e) => e.preventDefault()}
            >
              Quick View
            </Button>
          </div>
        </div>
      </Link>

      <Card.Body>
        <div className="product-header">
          <Link to={`/handpicked/productos/${product.id}`} className="product-name">
            <h3>{product.name}</h3>
          </Link>
          <FavoriteButton productId={product.id} />
        </div>

        {product.category && (
          <p className="product-category">{product.category}</p>
        )}

        <div className="product-footer">
          <div className="price-section">
            <span className="product-price">${formatPrice(product.price)}</span>
            {product.saleCount > 0 && (
              <span className="sales-count">{product.saleCount} sold</span>
            )}
          </div>

          <Button
            variant={isAdded ? "success" : "primary"}
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={addToCart.isLoading}
          >
            {addToCart.isLoading ? (
              <span className="btn-loading">...</span>
            ) : isAdded ? (
              "Added!"
            ) : (
              "Add to Cart"
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ModernBestSellersCard;