import React, { useState, useEffect } from 'react';
import BreadCrumb from "@/components/breadcrumb";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useDeleteNotification
} from "@/api/hooks";
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
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const items = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Alertas", link: "/dashboard/alertas" },
  ];

  // Fetch notifications from API
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useNotifications({
    limit: 50
  });

  // Mutations for marking as read and deleting
  const markAsReadMutation = useMarkNotificationAsRead();
  const deleteNotificationMutation = useDeleteNotification();

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
    const notificationDate = new Date(timestamp);
    const diff = now - notificationDate;
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

  const markAsRead = async (notificationId) => {
    try {
      await markAsReadMutation.mutateAsync({ id: notificationId, isRead: true });
      refetch(); // Refresh the notifications list
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteAlert = async (notificationId) => {
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
      refetch(); // Refresh the notifications list
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredAlerts = notifications.filter(notification => {
    const matchesFilter = filter === 'all' ||
      (filter === 'unread' && !notification.read) ||
      (filter === 'action_required' && notification.actionRequired) ||
      notification.severity === filter ||
      notification.category === filter;

    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(notification => !notification.read).length;
  const actionRequiredCount = notifications.filter(notification => notification.actionRequired && !notification.read).length;

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando alertas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alertas-dashboard">
        <div className="container-fluid p-4">
          <BreadCrumb items={items} activeItem="Alertas" />
          <div className="alert alert-warning mt-4">
            <BsExclamationTriangle className="me-2" />
            <div>
              <strong>Error al cargar alertas:</strong> {error.message || "Error desconocido"}
              <br />
              <small className="text-muted">
                <button className="btn btn-link p-0 ms-1" onClick={() => refetch()}>
                  Intentar de nuevo
                </button>
              </small>
            </div>
          </div>
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
            filteredAlerts.map(notification => (
              <div
                key={notification.id}
                className={`alert-card ${getSeverityClass(notification.severity)} ${!notification.read ? 'unread' : ''}`}
              >
                <div className="alert-header">
                  <div className="alert-icon">
                    {getAlertIcon(notification.type, notification.severity)}
                  </div>
                  <div className="alert-content">
                    <div className="alert-title-row">
                      <h5 className="alert-title">{notification.title}</h5>
                      <div className="alert-actions">
                        <span className="alert-time">
                          <BsClock size={14} className="me-1" />
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => markAsRead(notification.id)}
                            title="Marcar como leído"
                            disabled={markAsReadMutation.isLoading}
                          >
                            <BsEye size={14} />
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deleteAlert(notification.id)}
                          title="Eliminar alerta"
                          disabled={deleteNotificationMutation.isLoading}
                        >
                          <BsTrash size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="alert-message">{notification.message}</p>

                    {notification.actionRequired && !notification.read && (
                      <div className="alert-action-required">
                        <BsExclamationTriangle size={16} className="me-2" />
                        <span>Requiere acción</span>
                      </div>
                    )}

                    {/* Alert-specific data and actions */}
                    {notification.data && (
                      <div className="alert-data">
                        {notification.type === 'vendor_request' && (
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-success">Aprobar</button>
                            <button className="btn btn-sm btn-danger">Rechazar</button>
                            <button className="btn btn-sm btn-outline-primary">Ver detalles</button>
                          </div>
                        )}
                        {notification.type === 'delivery_issue' && (
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-primary">Ver orden</button>
                            <button className="btn btn-sm btn-warning">Contactar cliente</button>
                          </div>
                        )}
                        {notification.type === 'low_stock' && (
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-primary">Ver producto</button>
                            <button className="btn btn-sm btn-success">Reabastecer</button>
                          </div>
                        )}
                        {notification.type === 'payment_failed' && (
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
