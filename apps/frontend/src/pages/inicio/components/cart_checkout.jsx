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
    <div className="card shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-3">Resumen del Pedido</h5>

      {errorMessage && (
        <div className="alert alert-danger">{errorMessage}</div>
      )}

      <div className="d-flex justify-content-between mb-2">
        <span className="text-muted">Subtotal</span>
        <span>${CalcularSubTotal(cartItems).toFixed(2)}</span>
      </div>

      <div className="d-flex justify-content-between mb-2">
        <span className="text-muted">IVA (16%)</span>
        <span>${CalcularIVA(cartItems).toFixed(2)}</span>
      </div>

      <div className="d-flex justify-content-between mb-3">
        <span className="text-muted">Envío</span>
        <div>
          {zonesLoading
            ? 'Cargando zonas...'
            : (
              <select
                className="form-select form-select-sm"
                value={selectedZone?.id || ''}
                onChange={(e) => {
                  const zone = zones.find(z => z.id === parseInt(e.target.value, 10));
                  setSelectedZone(zone);
                }}
                style={{width: 'auto'}}
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
      <div className="d-flex justify-content-between mb-3">
        <span className="fw-bold">Total</span>
        <span className="fw-bold fs-5">${CalcularTotal(cartItems).toFixed(2)} MXN</span>
      </div>

      <button
        className="btn btn-dark w-100 mb-3"
        onClick={handleCheckout}
        disabled={createOrder.isLoading}
      >
        {createOrder.isLoading ? 'Procesando...' : 'Proceder al pago'}
      </button>
      <div className="text-center">
        <Link to="/handpicked/productos" className="text-decoration-none text-muted small">
          <i className="bi bi-arrow-left"></i> Seguir comprando
        </Link>
      </div>
      </div>
    </div>
  );
};

export default Checkout;
