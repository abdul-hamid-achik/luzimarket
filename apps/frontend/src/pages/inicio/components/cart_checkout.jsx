import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { useCreateOrder, useDeliveryZones } from "@/api/hooks";
import "@/pages/inicio/css/cart_checkout.css";
import { useState } from 'react';

const Checkout = ({ cartItems }) => {
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  // Delivery zones state
  const { data: zones = [], isLoading: zonesLoading } = useDeliveryZones();
  const [selectedZone, setSelectedZone] = useState(null);
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
    const shipping = selectedZone ? selectedZone.fee : 0;
    return CalcularSubTotal(cartItems) + CalcularIVA(cartItems) + shipping;
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
        <div>
          {zonesLoading
            ? 'Cargando zonas...'
            : (
              <select
                value={selectedZone?.id || ''}
                onChange={(e) => {
                  const zone = zones.find(z => z.id === parseInt(e.target.value, 10));
                  setSelectedZone(zone);
                }}
              >
                <option value="" disabled>Selecciona zona</option>
                {zones.map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} (${zone.fee.toFixed(2)})
                  </option>
                ))}
              </select>
            )}
        </div>
      </div>

      <hr />
      <div className="d-flex justify-content-between">
        <div>Total</div>
        <div>${CalcularTotal(cartItems).toFixed(2)}</div>
      </div>

      <button
        className="btn btn-dark w-100 mt-3"
        onClick={() => {
          createOrder.mutate({ deliveryZoneId: selectedZone?.id }, {
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
