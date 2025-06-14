import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTrackOrder } from '@/api/hooks';
import '@/pages/inicio/css/general.css';
import './order_tracking.css';

const OrderTracking = () => {
    const [searchParams] = useSearchParams();
    const [trackingNumber, setTrackingNumber] = useState(searchParams.get('tracking') || '');
    const trackOrderMutation = useTrackOrder();

    const handleTrackOrder = async (e) => {
        e.preventDefault();
        if (!trackingNumber.trim()) {
            return;
        }

        trackOrderMutation.mutate(trackingNumber.trim());
    };

    // Get data and states from mutation
    const { data: trackingData, isLoading: loading, error, isError } = trackOrderMutation;
    const errorMessage = isError ? (error?.response?.data?.error || 'Error al buscar el pedido. Por favor intenta de nuevo.') : '';

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'pending': 'badge-secondary',
            'processing': 'badge-warning',
            'shipped': 'badge-info',
            'in_transit': 'badge-info',
            'out_for_delivery': 'badge-primary',
            'delivered': 'badge-success',
            'exception': 'badge-danger',
            'returned': 'badge-warning',
            'cancelled': 'badge-danger'
        };
        return `badge ${statusClasses[status] || 'badge-secondary'}`;
    };

    const getStatusMessage = (status) => {
        const messages = {
            'pending': 'Pendiente de envío',
            'processing': 'Procesando envío',
            'shipped': 'Enviado',
            'in_transit': 'En tránsito',
            'out_for_delivery': 'En ruta de entrega',
            'delivered': 'Entregado',
            'exception': 'Incidencia en el envío',
            'returned': 'Devuelto',
            'cancelled': 'Cancelado'
        };
        return messages[status] || 'Estado desconocido';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'No disponible';
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getCarrierDisplayName = (carrier) => {
        const carriers = {
            'fedex': 'FedEx México',
            'ups': 'UPS México',
            'dhl': 'DHL México',
            'correos_mexico': 'Correos de México',
            'estafeta': 'Estafeta',
            'paquete_express': 'Paquete Express',
            'redpack': 'Redpack'
        };
        return carriers[carrier] || carrier;
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    {/* Tracking Search Form */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h2 className="card-title mb-0">
                                <i className="fas fa-search me-2"></i>
                                Rastrear Pedido
                            </h2>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleTrackOrder}>
                                <div className="row">
                                    <div className="col-md-8">
                                        <label htmlFor="trackingNumber" className="form-label">
                                            Número de Seguimiento
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="trackingNumber"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Ej: LZM-20250125-ABC123"
                                            disabled={loading}
                                        />
                                        <div className="form-text">
                                            Ingresa tu número de seguimiento para ver el estado de tu pedido
                                        </div>
                                    </div>
                                    <div className="col-md-4 d-flex align-items-end">
                                        <button
                                            type="submit"
                                            className="btn btn-primary w-100"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin me-2"></i>
                                                    Buscando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-search me-2"></i>
                                                    Rastrear
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {errorMessage && (
                                <div className="alert alert-danger mt-3">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tracking Results */}
                    {trackingData && (
                        <div className="tracking-results">
                            {/* Order Summary */}
                            <div className="card mb-4">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h3 className="mb-0">Información del Pedido</h3>
                                    <span className={getStatusBadgeClass(trackingData.order.status)}>
                                        {getStatusMessage(trackingData.order.status)}
                                    </span>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h6>Detalles del Envío</h6>
                                            <p><strong>Número de Seguimiento:</strong> {trackingData.order.tracking_number}</p>
                                            <p><strong>Transportista:</strong> {getCarrierDisplayName(trackingData.order.shipping_carrier)}</p>
                                            <p><strong>Servicio:</strong> {trackingData.order.shipping_service}</p>
                                            <p><strong>Total de Artículos:</strong> {trackingData.order.total_items}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <h6>Fechas Importantes</h6>
                                            <p><strong>Pedido Realizado:</strong> {formatDate(trackingData.order.created_at)}</p>
                                            {trackingData.order.shipped_at && (
                                                <p><strong>Enviado:</strong> {formatDate(trackingData.order.shipped_at)}</p>
                                            )}
                                            {trackingData.order.estimated_delivery && (
                                                <p><strong>Entrega Estimada:</strong> {formatDate(trackingData.order.estimated_delivery)}</p>
                                            )}
                                            {trackingData.order.delivered_at && (
                                                <p><strong>Entregado:</strong> {formatDate(trackingData.order.delivered_at)}</p>
                                            )}
                                        </div>
                                    </div>

                                    {trackingData.order.tracking_url && (
                                        <div className="mt-3">
                                            <a
                                                href={trackingData.order.tracking_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-outline-primary"
                                            >
                                                <i className="fas fa-external-link-alt me-2"></i>
                                                Rastrear en {getCarrierDisplayName(trackingData.order.shipping_carrier)}
                                            </a>
                                        </div>
                                    )}

                                    {trackingData.order.delivery_notes && (
                                        <div className="mt-3">
                                            <div className="alert alert-info">
                                                <strong>Notas de Entrega:</strong> {trackingData.order.delivery_notes}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Shipping Address */}
                            {trackingData.shippingAddress && (
                                <div className="card mb-4">
                                    <div className="card-header">
                                        <h5 className="mb-0">
                                            <i className="fas fa-map-marker-alt me-2"></i>
                                            Dirección de Entrega
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <p className="mb-1">{trackingData.shippingAddress.city}, {trackingData.shippingAddress.state}</p>
                                        <p className="mb-0">CP: {trackingData.shippingAddress.postalCode}, {trackingData.shippingAddress.country}</p>
                                    </div>
                                </div>
                            )}

                            {/* Tracking Timeline */}
                            <div className="card">
                                <div className="card-header">
                                    <h5 className="mb-0">
                                        <i className="fas fa-history me-2"></i>
                                        Historial de Seguimiento
                                    </h5>
                                </div>
                                <div className="card-body">
                                    {trackingData.trackingHistory && trackingData.trackingHistory.length > 0 ? (
                                        <div className="tracking-timeline">
                                            {trackingData.trackingHistory.map((event, index) => (
                                                <div key={index} className="timeline-item">
                                                    <div className="timeline-marker">
                                                        <i className="fas fa-circle"></i>
                                                    </div>
                                                    <div className="timeline-content">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <h6 className="mb-1">{event.description}</h6>
                                                                <span className={`badge ${getStatusBadgeClass(event.status)} me-2`}>
                                                                    {getStatusMessage(event.status)}
                                                                </span>
                                                                {event.location && (
                                                                    <small className="text-muted">
                                                                        <i className="fas fa-map-marker-alt me-1"></i>
                                                                        {event.location}
                                                                    </small>
                                                                )}
                                                            </div>
                                                            <small className="text-muted">
                                                                {formatDate(event.timestamp)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <i className="fas fa-info-circle fa-2x text-muted mb-3"></i>
                                            <p className="text-muted">No hay actualizaciones de seguimiento disponibles aún.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help Section */}
                    <div className="card mt-4">
                        <div className="card-body">
                            <h6>¿Necesitas Ayuda?</h6>
                            <p className="mb-2">Si tienes problemas con tu pedido o seguimiento, contáctanos:</p>
                            <ul className="list-unstyled">
                                <li><i className="fas fa-envelope me-2"></i>soporte@luzimarket.com</li>
                                <li><i className="fas fa-phone me-2"></i>+52 (555) 123-4567</li>
                                <li><i className="fas fa-clock me-2"></i>Lunes a Viernes, 9:00 AM - 6:00 PM</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking; 