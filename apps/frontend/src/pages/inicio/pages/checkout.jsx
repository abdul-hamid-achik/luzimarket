import React, { useState, useEffect } from 'react';
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

    // Calculate total from cart
    useEffect(() => {
        if (cart?.items) {
            const total = cart.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
            setOrderTotal(total);
        }
    }, [cart]);

    // Create order and payment intent when component mounts
    useEffect(() => {
        const initializePayment = async () => {
            if (!cart?.items || cart.items.length === 0) {
                navigate('/carrito');
                return;
            }

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
            } catch (err) {
                console.error('Error initializing payment:', err);
                setError('Failed to initialize payment. Please try again.');
            }
        };

        if (orderTotal > 0) {
            initializePayment();
        }
    }, [orderTotal, cart, createOrderMutation, navigate]);

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

    if (!cart?.items || cart.items.length === 0) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning">
                    <h4>Your cart is empty</h4>
                    <p>Add some items to your cart before checking out.</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/handpicked/productos')}
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
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
                                </div>
                            )}

                            {clientSecret ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <h5>Payment Information</h5>
                                        <PaymentElement />
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
                            {cart.items.map((item) => (
                                <div key={item.id} className="d-flex justify-content-between mb-2">
                                    <span>{item.productName || `Product ${item.productId}`} x {item.quantity}</span>
                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <hr />
                            <div className="d-flex justify-content-between fw-bold">
                                <span>Total:</span>
                                <span>${orderTotal.toFixed(2)} MXN</span>
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