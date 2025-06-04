import React, { useState, useEffect } from 'react';
import BreadCrumb from "@/components/breadcrumb";
import {
  BsExclamationTriangle,
  BsCheckCircle,
  BsInfoCircle,
  BsXCircle,
  BsBell,
  BsEye,
  BsEyeSlash,
  BsTrash,
  BsFilter,
  BsSearch,
  BsClock,
  BsShop,
  BsTruck,
  BsPerson,
  BsBoxSeam,
  BsCurrencyDollar,
  BsGear
} from "react-icons/bs";
import './alertas.css';

const Alertas = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const items = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Alertas", link: "/dashboard/alertas" },
  ];

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      // Simulate loading alerts from various sources
      const mockAlerts = [
        {
          id: 1,
          type: 'vendor_request',
          severity: 'warning',
          title: 'Nueva solicitud de vendedor',
          message: 'Artesanías Mexicanas ha solicitado unirse como vendedor',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: false,
          category: 'vendors',
          actionRequired: true,
          data: { vendorName: 'Artesanías Mexicanas', email: 'contacto@artesanias.mx' }
        },
        {
          id: 2,
          type: 'delivery_issue',
          severity: 'error',
          title: 'Problema de entrega',
          message: 'Orden #ORD-2024-001 reporta dirección incorrecta',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          read: false,
          category: 'orders',
          actionRequired: true,
          data: { orderId: 'ORD-2024-001', customer: 'María García' }
        },
        {
          id: 3,
          type: 'low_stock',
          severity: 'warning',
          title: 'Stock bajo',
          message: 'Tetera Sowden tiene menos de 5 unidades disponibles',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          read: true,
          category: 'inventory',
          actionRequired: true,
          data: { productName: 'Tetera Sowden', currentStock: 3 }
        },
        {
          id: 4,
          type: 'payment_failed',
          severity: 'error',
          title: 'Pago fallido',
          message: 'Orden #ORD-2024-002 - Pago rechazado por el banco',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          read: false,
          category: 'payments',
          actionRequired: true,
          data: { orderId: 'ORD-2024-002', amount: 1250.00 }
        },
        {
          id: 5,
          type: 'customer_petition',
          severity: 'info',
          title: 'Nueva petición de cliente',
          message: 'Solicitud de productos orgánicos en la categoría de alimentos',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          read: true,
          category: 'petitions',
          actionRequired: false,
          data: { petitionType: 'product_request', category: 'alimentos' }
        },
        {
          id: 6,
          type: 'system_maintenance',
          severity: 'info',
          title: 'Mantenimiento programado',
          message: 'El sistema estará en mantenimiento el domingo de 2:00 AM a 4:00 AM',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          read: true,
          category: 'system',
          actionRequired: false,
          data: { maintenanceDate: '2024-01-28', duration: '2 horas' }
        },
        {
          id: 7,
          type: 'high_sales',
          severity: 'success',
          title: 'Ventas excepcionales',
          message: 'Las ventas de hoy superaron el objetivo diario en un 150%',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          read: true,
          category: 'sales',
          actionRequired: false,
          data: { salesAmount: 45250, target: 30000 }
        }
      ];

      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type, severity) => {
    const iconProps = { size: 20 };

    switch (type) {
      case 'vendor_request':
        return <BsShop {...iconProps} />;
      case 'delivery_issue':
        return <BsTruck {...iconProps} />;
      case 'low_stock':
        return <BsBoxSeam {...iconProps} />;
      case 'payment_failed':
        return <BsCurrencyDollar {...iconProps} />;
      case 'customer_petition':
        return <BsPerson {...iconProps} />;
      case 'system_maintenance':
        return <BsGear {...iconProps} />;
      case 'high_sales':
        return <BsCurrencyDollar {...iconProps} />;
      default:
        switch (severity) {
          case 'error':
            return <BsXCircle {...iconProps} />;
          case 'warning':
            return <BsExclamationTriangle {...iconProps} />;
          case 'success':
            return <BsCheckCircle {...iconProps} />;
          default:
            return <BsInfoCircle {...iconProps} />;
        }
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'error':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      case 'success':
        return 'alert-success';
      default:
        return 'alert-info';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `hace ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      return 'hace unos minutos';
    }
  };

  const markAsRead = (alertId) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
  };

  const deleteAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' ||
      (filter === 'unread' && !alert.read) ||
      (filter === 'action_required' && alert.actionRequired) ||
      alert.severity === filter ||
      alert.category === filter;

    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = alerts.filter(alert => !alert.read).length;
  const actionRequiredCount = alerts.filter(alert => alert.actionRequired && !alert.read).length;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando alertas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="alertas-dashboard">
      <div className="container-fluid p-4">
        <BreadCrumb items={items} activeItem="Alertas" />

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">
              <BsBell className="me-2" />
              Centro de Alertas
            </h2>
            <p className="text-muted mb-0">
              Gestiona notificaciones y alertas del sistema
            </p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="alert-stats">
              <span className="badge bg-danger me-2">
                {unreadCount} sin leer
              </span>
              <span className="badge bg-warning">
                {actionRequiredCount} requieren acción
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <BsSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar alertas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <select
                  className="form-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">Todas las alertas</option>
                  <option value="unread">Sin leer</option>
                  <option value="action_required">Requieren acción</option>
                  <option value="error">Errores</option>
                  <option value="warning">Advertencias</option>
                  <option value="success">Éxitos</option>
                  <option value="info">Información</option>
                  <option value="vendors">Vendedores</option>
                  <option value="orders">Órdenes</option>
                  <option value="inventory">Inventario</option>
                  <option value="payments">Pagos</option>
                  <option value="petitions">Peticiones</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="alerts-container">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-5">
              <BsBell size={64} className="text-muted mb-3" />
              <h4 className="text-muted">No hay alertas</h4>
              <p className="text-muted">
                {searchTerm || filter !== 'all'
                  ? 'No se encontraron alertas con los filtros aplicados'
                  : 'No tienes alertas en este momento'
                }
              </p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`alert-card ${getSeverityClass(alert.severity)} ${!alert.read ? 'unread' : ''}`}
              >
                <div className="alert-header">
                  <div className="alert-icon">
                    {getAlertIcon(alert.type, alert.severity)}
                  </div>
                  <div className="alert-content">
                    <div className="alert-title-row">
                      <h5 className="alert-title">{alert.title}</h5>
                      <div className="alert-actions">
                        <span className="alert-time">
                          <BsClock size={14} className="me-1" />
                          {formatTimeAgo(alert.timestamp)}
                        </span>
                        {!alert.read && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => markAsRead(alert.id)}
                            title="Marcar como leído"
                          >
                            <BsEye size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteAlert(alert.id)}
                          title="Eliminar alerta"
                        >
                          <BsTrash size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="alert-message">{alert.message}</p>

                    {alert.actionRequired && !alert.read && (
                      <div className="alert-action-required">
                        <BsExclamationTriangle size={16} className="me-2" />
                        <span>Requiere acción</span>
                      </div>
                    )}

                    {/* Alert-specific data */}
                    {alert.data && (
                      <div className="alert-data">
                        {alert.type === 'vendor_request' && (
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-success">Aprobar</button>
                            <button className="btn btn-sm btn-danger">Rechazar</button>
                            <button className="btn btn-sm btn-outline-primary">Ver detalles</button>
                          </div>
                        )}
                        {alert.type === 'delivery_issue' && (
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-primary">Ver orden</button>
                            <button className="btn btn-sm btn-warning">Contactar cliente</button>
                          </div>
                        )}
                        {alert.type === 'low_stock' && (
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-primary">Ver producto</button>
                            <button className="btn btn-sm btn-success">Reabastecer</button>
                          </div>
                        )}
                        {alert.type === 'payment_failed' && (
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-primary">Ver orden</button>
                            <button className="btn btn-sm btn-warning">Reintentar pago</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Alertas;
