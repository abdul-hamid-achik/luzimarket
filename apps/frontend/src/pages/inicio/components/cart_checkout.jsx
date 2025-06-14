import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { useCreateOrder, useDeliveryZones } from "@/api/hooks";
import "@/pages/inicio/css/cart_checkout.css";
import { useState, useEffect } from 'react';
import { secureStorage } from '@/utils/storage';
import { useAuth } from '@/context/auth_context';

const Checkout = ({ cartItems }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const createOrder = useCreateOrder();
  // Delivery zones state
  const { data: zones = [], isLoading: zonesLoading } = useDeliveryZones();
  const [selectedZone, setSelectedZone] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-select first delivery zone if none selected
  useEffect(() => {
    if (zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0]);
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

    // Check if user is authenticated
    if (!isAuthenticated) {
      console.error("User not authenticated!");
      setErrorMessage("You must be logged in to checkout. Please login first.");
      // Redirect to login
      navigate('/login', { state: { returnTo: '/carrito' } });
      return;
    }

    // Verify token exists in secure storage
    const token = secureStorage.getAccessToken();
    if (!token) {
      console.error("No authentication token found in secure storage!");
      setErrorMessage("Authentication error. Please login again.");
      navigate('/login', { state: { returnTo: '/carrito' } });
      return;
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

    // Navigate to the Stripe checkout page
    // Store selected delivery zone in sessionStorage for the checkout page
    sessionStorage.setItem('selectedDeliveryZone', JSON.stringify(selectedZone));
    navigate('/checkout');
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
