import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '@/api/hooks';
import { Alert, Spinner, Badge } from 'react-bootstrap';
import '@/pages/inicio/css/general.css';
import './mis_pedidos.css';

const MisPedidos = () => {
    const { data: orders, isLoading, error } = useOrders();
    const [selectedOrder, setSelectedOrder] = useState(null);

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending': { bg: 'warning', text: 'Pendiente' },
            'processing': { bg: 'info', text: 'Procesando' },
            'paid': { bg: 'primary', text: 'Pagado' },
            'shipped': { bg: 'primary', text: 'Enviado' },
            'delivered': { bg: 'success', text: 'Entregado' },
            'cancelled': { bg: 'danger', text: 'Cancelado' },
            'refunded': { bg: 'secondary', text: 'Reembolsado' }
        };
        const config = statusConfig[status] || { bg: 'secondary', text: status };
        return <Badge bg={config.bg} className="status-badge">{config.text}</Badge>;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No disponible';
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="container py-5">
                <div className="text-center">
                    <Spinner animation="border" role="status" className="mb-3">
                        <span className="visually-hidden">Cargando pedidos...</span>
                    </Spinner>
                    <p className="text-muted">Cargando tus pedidos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-5">
                <Alert variant="danger">
                    <Alert.Heading>Error al cargar pedidos</Alert.Heading>
                    <p>No pudimos cargar tus pedidos. Por favor, intenta de nuevo más tarde.</p>
                </Alert>
            </div>
        );
    }

    const activeOrders = orders?.filter(order => !['delivered', 'cancelled', 'refunded'].includes(order.status)) || [];
    const pastOrders = orders?.filter(order => ['delivered', 'cancelled', 'refunded'].includes(order.status)) || [];

    return (
        <div className="mis-pedidos-container">
            <div className="container py-5">
                {/* Page Header */}
                <div className="page-header mb-5">
                    <h1 className="page-title">Mis Pedidos</h1>
                    <p className="page-subtitle">Gestiona y rastrea todos tus pedidos</p>
                </div>

                {/* No Orders State */}
                {(!orders || orders.length === 0) ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <i className="fas fa-shopping-bag"></i>
                        </div>
                        <h3>No tienes pedidos aún</h3>
                        <p className="text-muted">¡Empieza a comprar y tus pedidos aparecerán aquí!</p>
                        <Link to="/handpicked/productos" className="btn btn-primary mt-3">
                            Explorar Productos
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Active Orders */}
                        {activeOrders.length > 0 && (
                            <div className="orders-section mb-5">
                                <h2 className="section-title">Pedidos Activos</h2>
                                <div className="orders-grid">
                                    {activeOrders.map(order => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            getStatusBadge={getStatusBadge}
                                            formatDate={formatDate}
                                            formatCurrency={formatCurrency}
                                            onClick={() => setSelectedOrder(order)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past Orders */}
                        {pastOrders.length > 0 && (
                            <div className="orders-section">
                                <h2 className="section-title">Pedidos Anteriores</h2>
                                <div className="orders-grid">
                                    {pastOrders.map(order => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            getStatusBadge={getStatusBadge}
                                            formatDate={formatDate}
                                            formatCurrency={formatCurrency}
                                            onClick={() => setSelectedOrder(order)}
                                            isPast
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    getStatusBadge={getStatusBadge}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                />
            )}
        </div>
    );
};

// Order Card Component
const OrderCard = ({ order, getStatusBadge, formatDate, formatCurrency, onClick, isPast = false }) => {
    const firstItem = order.items?.[0];
    const additionalItems = (order.items?.length || 0) - 1;

    return (
        <div className={`order-card ${isPast ? 'order-past' : ''}`} onClick={onClick}>
            <div className="order-header">
                <div className="order-info">
                    <h4 className="order-number">Pedido #{order.id.slice(-8)}</h4>
                    <p className="order-date">{formatDate(order.created_at)}</p>
                </div>
                {getStatusBadge(order.status)}
            </div>

            <div className="order-content">
                {firstItem && (
                    <div className="order-preview">
                        <img
                            src={firstItem.imageUrl || 'https://via.placeholder.com/80'}
                            alt={firstItem.name}
                            className="order-preview-image"
                        />
                        <div className="order-preview-info">
                            <h5 className="product-name">{firstItem.name}</h5>
                            {additionalItems > 0 && (
                                <p className="additional-items">
                                    +{additionalItems} {additionalItems === 1 ? 'producto' : 'productos'} más
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="order-footer">
                <div className="order-total">
                    <span className="total-label">Total</span>
                    <span className="total-amount">{formatCurrency(order.total)}</span>
                </div>
                {order.tracking_number && (
                    <Link
                        to={`/track?tracking=${order.tracking_number}`}
                        className="track-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <i className="fas fa-truck me-1"></i>
                        Rastrear
                    </Link>
                )}
            </div>
        </div>
    );
};

// Order Detail Modal Component
const OrderDetailModal = ({ order, onClose, getStatusBadge, formatDate, formatCurrency }) => {
    return (
        <div className="order-modal-overlay" onClick={onClose}>
            <div className="order-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Detalles del Pedido</h3>
                    <button className="close-button" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {/* Order Info */}
                    <div className="detail-section">
                        <div className="detail-row">
                            <span className="detail-label">Número de pedido:</span>
                            <span className="detail-value">#{order.id}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Fecha:</span>
                            <span className="detail-value">{formatDate(order.created_at)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Estado:</span>
                            <span className="detail-value">{getStatusBadge(order.status)}</span>
                        </div>
                        {order.tracking_number && (
                            <div className="detail-row">
                                <span className="detail-label">Número de seguimiento:</span>
                                <Link to={`/track?tracking=${order.tracking_number}`} className="tracking-number">
                                    {order.tracking_number}
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Products */}
                    <div className="detail-section">
                        <h4 className="section-subtitle">Productos</h4>
                        <div className="products-list">
                            {order.items?.map((item, index) => (
                                <div key={index} className="product-item">
                                    <img
                                        src={item.imageUrl || 'https://via.placeholder.com/60'}
                                        alt={item.name}
                                        className="product-image"
                                    />
                                    <div className="product-info">
                                        <h5>{item.name}</h5>
                                        <p className="product-quantity">Cantidad: {item.quantity}</p>
                                    </div>
                                    <div className="product-price">
                                        {formatCurrency(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shipping_address && (
                        <div className="detail-section">
                            <h4 className="section-subtitle">Dirección de envío</h4>
                            <p className="address-text">
                                {order.shipping_address.street}<br />
                                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                            </p>
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="detail-section order-summary">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal || order.total * 0.84)}</span>
                        </div>
                        <div className="summary-row">
                            <span>IVA</span>
                            <span>{formatCurrency(order.tax || order.total * 0.16)}</span>
                        </div>
                        {order.shipping_fee > 0 && (
                            <div className="summary-row">
                                <span>Envío</span>
                                <span>{formatCurrency(order.shipping_fee)}</span>
                            </div>
                        )}
                        <div className="summary-row total">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    {order.tracking_number && (
                        <Link
                            to={`/track?tracking=${order.tracking_number}`}
                            className="btn btn-primary"
                        >
                            <i className="fas fa-truck me-2"></i>
                            Rastrear Pedido
                        </Link>
                    )}
                    <button className="btn btn-outline-primary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MisPedidos;