import "@/pages/inicio/css/cart_item.css";
import { useEffect, useState } from 'react';
import { useProduct } from "@/api/hooks";

const CartItem = ({ item, onRemove, onQuantityChange }) => {
  const [productDetails, setProductDetails] = useState(null);

  // Use the product API to get full product details if we only have an ID
  const { data: product, isLoading, error } = useProduct(item.productId || item.variantId);

  useEffect(() => {
    if (product) {
      setProductDetails(product);
    }
  }, [product]);

  // Determine if we have enough data to display
  const hasData = productDetails || (item.name && item.price);

  if (isLoading) {
    return (
      <div className="cart-item cart-product quantity-display item-quantity cart-quantity">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading product details...</span>
        </div>
      </div>
    );
  }

  if (error || !hasData) {
    return (
      <div className="cart-item cart-product cart-quantity quantity-display item-quantity">
        <p>Error loading item details. <button className="btn btn-sm btn-outline-danger" onClick={() => onRemove(item.id)}>Remove</button></p>
      </div>
    );
  }

  // Normalize fields from API response or product details
  const name = item.name || productDetails?.name || 'Product';
  const priceRaw = item.price || productDetails?.price || 0;
  const price = typeof priceRaw === 'number' ? priceRaw : Number(priceRaw) || 0;
  const description = item.description || productDetails?.description || '';
  const imageUrl = item.image || productDetails?.imageUrl || 'https://via.placeholder.com/100';

  return (
    <div className="cart-item cart-product cart-item-row">
      <table className="table tabla-carrito">
        <tbody>
          <tr className="cart-item-row">
            <td className="borrar">
              <button className="remove-button delete-item remove" onClick={() => onRemove(item.id)}>
                x
              </button>
            </td>
            <td className="img">
              <img src={imageUrl} alt={name} className="item-image" />
            </td>
            <td className="descripcion">
              <div className="item-details">
                <h2 className="item-name">{name}</h2>
                <p className="item-description">{description}</p>
              </div>
            </td>
            <td className="price">
              <div className="item-options">
                <label>${price.toFixed(2)}</label>
              </div>
            </td>
            <td className="cantidad">
              <div className="quantity-controls cart-quantity">
                <button
                  className="quantity-button decrement minus"
                  onClick={() => onQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="quantity-display item-quantity">{item.quantity}</span>
                <button
                  className="quantity-button increment plus"
                  onClick={() => onQuantityChange(item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </td>
            <td className="total">
              <div className="item-total">
                ${(price * item.quantity).toFixed(2)}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default CartItem;
