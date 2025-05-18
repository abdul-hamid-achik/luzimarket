import "@/pages/inicio/css/cart_item.css";

const CartItem = ({ item, onRemove, onQuantityChange }) => {
  // Normalize fields from API
  const name = item.productName || item.name || '';
  const rawPriceValue = item.productPrice ?? item.price ?? 0;
const priceValue = typeof rawPriceValue === 'number' ? rawPriceValue : Number(rawPriceValue) || 0;
  const description = item.productDescription || item.description || '';
  const imageUrl = item.productImage || item.image || '';
  return (
    <table className="table tabla-carrito">
      <tbody>
        <tr>
          <td className="borrar">
            <button className="remove-button" onClick={() => onRemove(item.id)}>
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
              <label>${typeof priceValue === 'number' && !isNaN(priceValue) ? priceValue.toFixed(2) : '0.00'}</label>
            </div>
          </td>
          <td className="cantidad">
            <div className="quantity-controls">
              <button
                className="quantity-button"
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
              >
                -
              </button>
              <span className="quantity-display">{item.quantity}</span>
              <button
                className="quantity-button"
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
          </td>
          <td className="total">
            <div className="item-total">
              {typeof priceValue === 'number' && !isNaN(priceValue) ? `$${(priceValue * item.quantity).toFixed(2)}` : '$0.00'}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default CartItem;
