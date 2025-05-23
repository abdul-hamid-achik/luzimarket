import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useOrder } from "@/api/hooks";
import api from '@/api/client';
import '@/pages/inicio/css/general.css';

const OrderConfirmation = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { data, isLoading, error } = useOrder(id);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // Check for Stripe payment status from URL params
  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');

    if (paymentIntent && redirectStatus) {
      setPaymentStatus(redirectStatus);

      if (redirectStatus === 'failed') {
        setPaymentError('Payment failed. Please try again or contact support.');
      }
    }
  }, [searchParams]);

  // Fetch updated order status if payment was successful
  useEffect(() => {
    if (paymentStatus === 'succeeded' && id) {
      // Optionally refetch order data to get updated payment status
      // The webhook should have already updated the order status
    }
  }, [paymentStatus, id]);

  if (isLoading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading order...</span>
          </div>
          <p className="mt-3">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Error Loading Order</h4>
          <p>We couldn't load your order details. Please try again or contact support.</p>
          <Link to="/" className="btn btn-primary">Return to Home</Link>
        </div>
      </div>
    );
  }

  const { order, items } = data || {};

  const getPaymentStatusBadge = () => {
    const status = order?.payment_status || paymentStatus;

    switch (status) {
      case 'succeeded':
        return <span className="badge bg-success">Payment Successful</span>;
      case 'processing':
        return <span className="badge bg-warning">Processing Payment</span>;
      case 'failed':
        return <span className="badge bg-danger">Payment Failed</span>;
      case 'canceled':
        return <span className="badge bg-secondary">Payment Canceled</span>;
      default:
        return <span className="badge bg-info">Pending Payment</span>;
    }
  };

  const getOrderStatusBadge = () => {
    const status = order?.status;

    switch (status) {
      case 'processing':
        return <span className="badge bg-primary">Processing</span>;
      case 'shipped':
        return <span className="badge bg-info">Shipped</span>;
      case 'delivered':
        return <span className="badge bg-success">Delivered</span>;
      case 'cancelled':
        return <span className="badge bg-danger">Cancelled</span>;
      case 'payment_failed':
        return <span className="badge bg-danger">Payment Failed</span>;
      default:
        return <span className="badge bg-secondary">Pending</span>;
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Success/Error Messages */}
          {paymentStatus === 'succeeded' && (
            <div className="alert alert-success" role="alert">
              <h4 className="alert-heading">Payment Successful!</h4>
              <p>Thank you for your order. Your payment has been processed successfully.</p>
            </div>
          )}

          {paymentError && (
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Payment Issue</h4>
              <p>{paymentError}</p>
              <hr />
              <p className="mb-0">
                <Link to={`/checkout`} className="btn btn-outline-danger">
                  Try Payment Again
                </Link>
              </p>
            </div>
          )}

          {/* Order Details Card */}
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Order Confirmation</h3>
              <div>
                {getPaymentStatusBadge()}
                {getOrderStatusBadge()}
              </div>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <h5>Order Information</h5>
                  <p><strong>Order ID:</strong> {order?.id}</p>
                  <p><strong>Order Date:</strong> {order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Total Amount:</strong> ${Number(order?.total || 0).toFixed(2)} MXN</p>
                </div>
                <div className="col-md-6">
                  <h5>Payment Information</h5>
                  <p><strong>Payment Status:</strong> {getPaymentStatusBadge()}</p>
                  {order?.payment_intent_id && (
                    <p><strong>Payment ID:</strong> {order.payment_intent_id}</p>
                  )}
                  <p><strong>Payment Method:</strong> Credit Card</p>
                </div>
              </div>

              {/* Order Items */}
              <h5>Order Items</h5>
              {items && items.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.productName || `Product ${item.productId}`}</td>
                          <td>{item.quantity}</td>
                          <td>${Number(item.price / item.quantity).toFixed(2)}</td>
                          <td>${Number(item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-active">
                        <th colspan="3">Total</th>
                        <th>${Number(order?.total || 0).toFixed(2)} MXN</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info">
                  <p>No items found for this order.</p>
                </div>
              )}

              {/* Next Steps */}
              <div className="mt-4">
                <h5>What's Next?</h5>
                {order?.status === 'processing' && (
                  <div className="alert alert-info">
                    <p>Your order is being processed. You'll receive an email confirmation shortly with tracking information.</p>
                  </div>
                )}

                {order?.status === 'payment_failed' && (
                  <div className="alert alert-warning">
                    <p>There was an issue with your payment. Please try again or contact our support team.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="d-flex gap-3 mt-4">
                <Link to="/" className="btn btn-primary">
                  Continue Shopping
                </Link>
                <Link to="/perfil" className="btn btn-outline-secondary">
                  View All Orders
                </Link>
                {(order?.status === 'payment_failed' || paymentStatus === 'failed') && (
                  <Link to="/checkout" className="btn btn-warning">
                    Retry Payment
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Support Information */}
          <div className="card mt-4">
            <div className="card-body">
              <h6>Need Help?</h6>
              <p className="mb-2">If you have any questions about your order, please contact our support team:</p>
              <ul className="list-unstyled">
                <li><i className="fas fa-envelope me-2"></i>support@luzimarket.com</li>
                <li><i className="fas fa-phone me-2"></i>+52 (555) 123-4567</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;