import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { useCreateOrder, useDeliveryZones } from "@/api/hooks";
import "@/pages/inicio/css/cart_checkout.css";
import { useState, useEffect } from 'react';

const Checkout = ({ cartItems }) => {
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  // Delivery zones state
  const { data: zones = [], isLoading: zonesLoading } = useDeliveryZones();
  const [selectedZone, setSelectedZone] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-select first delivery zone if none selected
  useEffect(() => {
    if (zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0]);
      console.log("Auto-selected delivery zone:", zones[0]);
    }
  }, [zones, selectedZone]);

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

  const handleCheckout = () => {
    // Clear any previous errors
    setErrorMessage("");

    // Verify token exists before proceeding
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found!");
      setErrorMessage("You must be logged in to checkout. Please login first.");
      // Try to restore from localStorage as fallback
      const backupToken = localStorage.getItem('token');
      if (backupToken) {
        console.log("Restoring token from localStorage");
        sessionStorage.setItem('token', backupToken);
      } else {
        // Redirect to login if no token can be found
        navigate('/login', { state: { returnTo: '/carrito' } });
        return;
      }
    }

    // Ensure a delivery zone is selected
    if (!selectedZone) {
      if (zones.length > 0) {
        setSelectedZone(zones[0]);
      } else {
        setErrorMessage("Please select a delivery zone");
        return;
      }
    }

    // Proceed with order creation
    createOrder.mutate({ deliveryZoneId: selectedZone?.id }, {
      onSuccess: (data) => {
        navigate(`/order-confirmation/${data.id}`);
      },
      onError: (error) => {
        console.error("Checkout error:", error);
        if (error.response?.status === 401) {
          setErrorMessage("Authentication error. Please login again.");
          navigate('/login', { state: { returnTo: '/carrito' } });
        } else {
          setErrorMessage(error.response?.data?.error || "Error processing your order. Please try again.");
        }
      }
    });
  };

  return (
    <div className="container" style={{ width: "50%", height: "100%" }}>
      <h2>Total del Carrito</h2>
      <hr />

      {errorMessage && (
        <div className="alert alert-danger">{errorMessage}</div>
      )}

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
        onClick={handleCheckout}
        disabled={createOrder.isLoading}
      >
        {createOrder.isLoading ? 'Procesando...' : 'Pagar'}
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
