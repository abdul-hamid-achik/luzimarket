import "@/pages/pagina_principal/css/cart_item.css";

const CartItem = ({ item, onRemove, onQuantityChange }) => {
  return (
    <>
      <div className="table tabla-carrito">
        <tbody>
          <tr>
            <td className="borrar">
              <button
                className="remove-button"
                onClick={() => onRemove(item.id)}
              >
                x
              </button>
            </td>
            <td className="img">
              <img src={item.image} alt={item.name} className="item-image" />
            </td>
            <td className="descripcion">
              <div className="item-details">
                <h2 className="item-name">{item.name}</h2>
                <p className="item-description">{item.description}</p>
              </div>
            </td>
            <td className="price">
              <div className="item-options">
                <label>${item.price.toFixed(2)}</label>
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
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </td>
          </tr>
        </tbody>
      </div>
    </>
  );
};

export default CartItem;
