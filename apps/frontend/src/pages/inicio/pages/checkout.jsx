import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart, useCreateOrder } from '@/api/hooks';
import api from '@/api/client';
import '@/pages/inicio/css/general.css';

const CheckoutPage = () => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const { data: cart, isLoading: cartLoading } = useCart();
    const createOrderMutation = useCreateOrder();

    const [clientSecret, setClientSecret] = useState('');
    const [orderId, setOrderId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [orderTotal, setOrderTotal] = useState(0);
    const [deliveryZone, setDeliveryZone] = useState(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const hasInitialized = useRef(false);
    const [orderSummary, setOrderSummary] = useState(null); // Store order summary before cart is cleared

    // Load delivery zone from sessionStorage
    useEffect(() => {
        const storedDeliveryZone = sessionStorage.getItem('selectedDeliveryZone');
        if (storedDeliveryZone) {
            try {
                setDeliveryZone(JSON.parse(storedDeliveryZone));
            } catch (e) {
                console.error('Error parsing delivery zone:', e);
            }
        }
    }, []);

    // Calculate total from cart including delivery
    useEffect(() => {
        if (cart?.items) {
            const subtotal = cart.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
            const iva = subtotal * 0.16;
            const shipping = deliveryZone?.fee || 0;
            const total = subtotal + iva + shipping;
            setOrderTotal(total);
        }
    }, [cart, deliveryZone]);

    // Create order and payment intent when component mounts
    useEffect(() => {
        // Only initialize when we have cart data and a valid total
        if (cartLoading || orderTotal <= 0 || hasInitialized.current || isInitializing || createOrderMutation.isLoading) {
            return;
        }

        const initializePayment = async () => {
            if (!cart?.items || cart.items.length === 0) {
                navigate('/carrito');
                return;
            }

            hasInitialized.current = true;
            setIsInitializing(true);

            // Store order summary before creating order (which clears the cart)
            const summary = {
                items: [...cart.items],
                subtotal: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                iva: cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.16,
                shipping: deliveryZone?.fee || 0,
                total: orderTotal,
                deliveryZone: deliveryZone
            };
            setOrderSummary(summary);

            try {
                // First create the order
                const orderResponse = await createOrderMutation.mutateAsync({});
                const newOrderId = orderResponse.orderId || orderResponse.id;
                setOrderId(newOrderId);

                // Then create payment intent
                const paymentResponse = await api.post('/create-payment-intent', {
                    orderId: newOrderId,
                    amount: orderTotal,
                    currency: 'mxn'
                });

                setClientSecret(paymentResponse.data.clientSecret);
                console.log('Payment intent created with client secret:', paymentResponse.data.clientSecret);
                setIsInitializing(false);
            } catch (err) {
                console.error('Error initializing payment:', err);
                setError('Failed to initialize payment. Please try again.');
                setIsInitializing(false);
                hasInitialized.current = false; // Allow retry on error
            }
        };

        initializePayment();
    }, [cartLoading, orderTotal]); // Simplified dependencies to prevent loops

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setError(submitError.message);
                setIsProcessing(false);
                return;
            }

            const { error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/order-confirmation/${orderId}`,
                },
            });

            if (confirmError) {
                setError(confirmError.message);
                setIsProcessing(false);
            }
            // If no error, user will be redirected to return_url
        } catch (err) {
            console.error('Payment error:', err);
            setError('An unexpected error occurred. Please try again.');
            setIsProcessing(false);
        }
    };

    if (cartLoading) {
        return (
            <div className="container mt-5">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading checkout...</p>
                </div>
            </div>
        );
    }

    // If we don't have cart items or order summary, show empty cart message
    if (!cart?.items || cart.items.length === 0) {
        // If we have a client secret, it means order was already created
        if (clientSecret && orderSummary) {
            // Continue with checkout using stored order summary
        } else {
            return (
                <div className="container mt-5">
                    <div className="text-center py-5">
                        <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '30px' }}>Tu carrito está vacío</h3>
                        <p style={{ fontSize: '1.1rem', color: '#666', marginBottom: '30px' }}>
                            Agrega algunos productos a tu carrito antes de proceder al pago.
                        </p>
                        <button
                            onClick={() => navigate('/handpicked/productos')}
                            style={{
                                display: 'inline-block',
                                padding: '12px 30px',
                                backgroundColor: '#000',
                                color: '#fff',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                transition: 'all 0.3s ease',
                                border: '1px solid #000',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#fff';
                                e.target.style.color = '#000';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#000';
                                e.target.style.color = '#fff';
                            }}
                        >
                            Continuar Comprando
                        </button>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <h3>Checkout</h3>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                    {!clientSecret && (
                                        <button 
                                            className="btn btn-sm btn-outline-danger ms-3"
                                            onClick={() => {
                                                setError('');
                                                setIsInitializing(false);
                                                hasInitialized.current = false;
                                            }}
                                        >
                                            Retry
                                        </button>
                                    )}
                                </div>
                            )}

                            {clientSecret ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <h5>Payment Information</h5>
                                        {stripe && elements ? (
                                            <PaymentElement />
                                        ) : (
                                            <div className="text-muted">Loading payment form...</div>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-between">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => navigate('/carrito')}
                                            disabled={isProcessing}
                                        >
                                            Back to Cart
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={!stripe || isProcessing}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Processing...
                                                </>
                                            ) : (
                                                `Pay $${orderTotal.toFixed(2)} MXN`
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="text-center">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading payment form...</span>
                                    </div>
                                    <p className="mt-3">Preparing payment form...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card">
                        <div className="card-header">
                            <h5>Order Summary</h5>
                        </div>
                        <div className="card-body">
                            {(orderSummary?.items || cart.items).map((item) => (
                                <div key={item.id} className="d-flex justify-content-between mb-2">
                                    <span>{item.name || item.productName || `Product ${item.productId}`} x {item.quantity}</span>
                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <hr />
                            <div className="d-flex justify-content-between">
                                <span>Subtotal:</span>
                                <span>${(orderSummary?.subtotal || cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)).toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>IVA (16%):</span>
                                <span>${(orderSummary?.iva || (cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.16)).toFixed(2)}</span>
                            </div>
                            {(orderSummary?.deliveryZone || deliveryZone) && (
                                <div className="d-flex justify-content-between">
                                    <span>Envío ({(orderSummary?.deliveryZone || deliveryZone).name}):</span>
                                    <span>${(orderSummary?.deliveryZone || deliveryZone).fee.toFixed(2)}</span>
                                </div>
                            )}
                            <hr />
                            <div className="d-flex justify-content-between fw-bold">
                                <span>Total:</span>
                                <span>${(orderSummary?.total || orderTotal).toFixed(2)} MXN</span>
                            </div>
                        </div>
                    </div>

                    <div className="card mt-3">
                        <div className="card-body">
                            <h6>Secure Payment</h6>
                            <p className="small text-muted">
                                Your payment information is encrypted and secure. We use Stripe to process payments safely.
                            </p>
                            <div className="d-flex align-items-center">
                                <i className="fas fa-lock me-2"></i>
                                <span className="small">SSL Encrypted</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage; 