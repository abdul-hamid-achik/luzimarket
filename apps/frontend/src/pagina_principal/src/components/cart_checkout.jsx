import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { useCreateOrder } from "../../../api/hooks";
import "../css/cart_checkout.css";

const Checkout = ({ cartItems }) => {
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  // Constantes de operaciones matematicas
  const CalcularSubTotal = (cartItems) => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const CalcularIVA = (cartItems) => {
    return CalcularSubTotal(cartItems) * 0.16;
  };

  const CalcularTotal = (cartItems) => {
    return CalcularSubTotal(cartItems) + CalcularIVA(cartItems) + 50;
  };

  return (
    <div className="container" style={{ width: "50%", height: "100%" }}>
      <h2>Total del Carrito</h2>
      <hr />

      <div className="d-flex justify-content-between">
        <div>SubTotal</div>
        <div>${CalcularSubTotal(cartItems).toFixed(2)}</div>
      </div>

      <div className="d-flex justify-content-between">
        <div>IVA(16%)</div>
        <div>${CalcularIVA(cartItems).toFixed(2)}</div>
      </div>

      <div className="d-flex justify-content-between">
        <div>Envio</div>
        <div>$50.00</div>
      </div>

      <hr />
      <div className="d-flex justify-content-between">
        <div>Total</div>
        <div>${CalcularTotal(cartItems).toFixed(2)}</div>
      </div>

      <button
        className="btn btn-dark w-100 mt-3"
        onClick={() => {
          createOrder.mutate({}, {
            onSuccess: (data) => {
              navigate(`/order-confirmation/${data.id}`);
            },
          });
        }}
      >
        Pagar
      </button>
      <div className="text-center mt-4">
        <Link to="/handpicked/productos" className="text-dark">
          Seguir Comprando
        </Link>
      </div>
    </div>
  );
};

export default Checkout;
