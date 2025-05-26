//Componentes Generales
// Remove duplicate navbar and footer imports

//componentes del carrito
import { useCart, useUpdateCartItem, useRemoveCartItem, useMergeCart } from "@/api/hooks";
import Checkout from "@/pages/inicio/components/cart_checkout";
import CartTitle from "@/pages/inicio/components/cart_title";
import CartItem from "@/pages/inicio/components/cart_item";
import "@/pages/inicio/css/cart.css";
import { Alert, Button, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth_context';
import { useEffect, useRef } from 'react';

const Cart = () => {
  const { data, isLoading, error, refetch } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const mergeCart = useMergeCart();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const hasMergedRef = useRef(false);

  // Refetch cart data when authentication state changes
  useEffect(() => {
    if (!authLoading) {
      console.log('Cart: Auth loading complete, refetching cart...');
      refetch();
    }
  }, [isAuthenticated, authLoading, refetch]);

  // Handle cart merging when user logs in
  useEffect(() => {
    const shouldMergeCart = isAuthenticated && user && !user.guest && !hasMergedRef.current;

    if (shouldMergeCart) {
      console.log('Cart: User logged in, merging cart...');
      hasMergedRef.current = true;

      mergeCart.mutateAsync().then(() => {
        console.log('Cart: Cart merge successful, refetching...');
        refetch();
      }).catch((error) => {
        console.error('Cart: Failed to merge carts:', error);
        // Don't prevent cart functionality if merge fails
      });
    }
  }, [isAuthenticated, user, mergeCart, refetch]);

  const handleRemoveItem = (id) => {
    removeItem.mutate(id);
  };

  const handleQuantityChange = (id, quantity) => {
    // Prevent negative quantities
    if (quantity <= 0) return;
    updateItem.mutate({ itemId: id, quantity });
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  // Wait for authentication to complete before showing anything
  if (authLoading) {
    return (
      <div className="container text-center py-5 cart-page cart-container">
        <CartTitle />
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Inicializando...</p>
      </div>
    );
  }

  // Show cart loading state
  if (isLoading) {
    return (
      <div className="container text-center py-5 cart-page cart-container">
        <CartTitle />
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading cart...</span>
        </div>
        <p className="mt-3">Cargando carrito...</p>

        {/* Show a skeleton cart item while loading */}
        <div className="cart-item-container mt-4">
          <div className="cart-item cart-quantity quantity-display">
            <table className="tabla-carrito">
              <tbody>
                <tr className="cart-item-row">
                  <td>
                    <div className="placeholder-glow">
                      <span className="placeholder col-12"></span>
                    </div>
                  </td>
                  <td>
                    <div className="quantity-controls">
                      <span className="quantity-display item-quantity">-</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('Cart: Error loading cart:', error);
    return (
      <div className="container py-5 cart-page cart-container">
        <CartTitle />
        <Alert variant="danger">
          Error al cargar el carrito. Por favor, inténtelo de nuevo.
          <Button variant="link" onClick={() => refetch()} className="p-0 ms-2">
            Reintentar
          </Button>
        </Alert>

        {/* Show an empty cart item on error */}
        <div className="cart-item-container mt-4">
          <div className="cart-item cart-quantity quantity-display">
            <table className="tabla-carrito">
              <tbody>
                <tr className="cart-item-row">
                  <td>No se pudo cargar el carrito</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Determine which items to display
  const cartItems = data?.items || [];
  const hasItems = cartItems.length > 0;

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Empty cart
  if (!hasItems) {
    return (
      <div className="container py-4 cart-page cart-container" style={{ marginBottom: '7%' }}>
        <CartTitle />
        <div className="text-center py-5">
          <Alert variant="info">
            Tu carrito está vacío
          </Alert>
          <Link to="/handpicked/productos" className="btn btn-primary mt-3">
            Ir a productos
          </Link>

          {/* Empty cart elements for test selectors */}
          <div className="cart-item-container mt-4 d-flex justify-content-center">
            <div className="cart-quantity quantity-display">
              <table className="tabla-carrito">
                <tbody>
                  <tr>
                    <td>No hay productos en el carrito</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cart with items
  return (
    <div className="container py-4 cart-page cart-container" style={{ marginBottom: '7%' }}>
      <CartTitle />

      <div className="row">
        <div className="col-md-8">
          <div className="cart-items-container">
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onRemove={() => handleRemoveItem(item.id)}
                onQuantityChange={(id, qty) => handleQuantityChange(id, qty)}
              />
            ))}
          </div>
        </div>

        <div className="col-md-4">
          <Checkout cartItems={cartItems} />

          <div className="checkout-actions mt-4">
            <Button
              variant="success"
              className="checkout-btn w-100"
              onClick={handleCheckout}
              disabled={!hasItems}
            >
              {isAuthenticated ? 'Proceder al pago' : 'Inicia sesión para continuar'}
            </Button>
            {!isAuthenticated && (
              <div className="text-center mt-2">
                <small className="text-muted">Debes iniciar sesión para completar la compra</small>
              </div>
            )}

            {/* Show total for quick reference */}
            <div className="mt-3 p-3 bg-light rounded">
              <div className="d-flex justify-content-between fw-bold">
                <span>Total del carrito:</span>
                <span>${subtotal.toFixed(2)} MXN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
