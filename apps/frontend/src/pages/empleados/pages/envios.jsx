import './envios.css';
import { useState } from "react";
import { useAdminOrders } from "@/api/hooks";
import BreadCrumb from "@/components/breadcrumb";
import {
  BsSearch,
  BsFilter,
  BsDownload,
  BsPlus,
  BsEye,
  BsPencilSquare,
  BsTrash,
  BsCheckCircle,
  BsExclamationTriangle,
  BsClock,
  BsShop,
  BsTruck
} from 'react-icons/bs';

function Ordenes() {
  const [BuscaTermino, setBuscarTermino] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedFulfillmentFilter, setSelectedFulfillmentFilter] = useState("all");
  const { data: DatosOrdenes = [], isLoading, error, refetch } = useAdminOrders();

  const items = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Envíos", link: "/dashboard/envios" }
  ];

  const handleCambioBusqueda = (event) => {
    setBuscarTermino(event.target.value);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const handleFulfillmentFilterChange = (filter) => {
    setSelectedFulfillmentFilter(filter);
  };

  // Function to shorten order IDs for better readability
  const shortenOrderId = (orderId) => {
    if (typeof orderId === 'string' && orderId.length > 12) {
      return `#${orderId.substring(orderId.length - 8)}`;
    }
    return `#${orderId}`;
  };

  // Create fallback orders for when the API fails
  const fallbackOrders = [
    {
      OrderID: "ord_a7e5a1cfd10040b2a0367c79db6ddd98",
      Total: "521.16",
      Cliente: "Mariana García",
      EstadoPago: "pagado",
      EstadoOrden: "enviado",
      TipoEnvio: "Express",
      Fecha: "2023-05-15",
      TrackingNumber: "LZ2023051501"
    },
    {
      OrderID: "ord_ddd14b9a9bae4e9c91eec6c083229201",
      Total: "602.78",
      Cliente: "Carlos Ruiz",
      EstadoPago: "pendiente",
      EstadoOrden: "procesando",
      TipoEnvio: "Estándar",
      Fecha: "2023-05-17",
      TrackingNumber: "LZ2023051702"
    },
    {
      OrderID: "ord_17f9077fa655458884969485e06d42c1",
      Total: "1218.61",
      Cliente: "Ana López",
      EstadoPago: "completado",
      EstadoOrden: "entregado",
      TipoEnvio: "Express",
      Fecha: "2023-05-14",
      TrackingNumber: "LZ2023051403"
    },
    {
      OrderID: "ord_576d89d185c543cba731d7dcedc7703d",
      Total: "547.07",
      Cliente: "Luis Martínez",
      EstadoPago: "failed",
      EstadoOrden: "cancelado",
      TipoEnvio: "Estándar",
      Fecha: "2023-05-13",
      TrackingNumber: "LZ2023051304"
    }
  ];

  // Use fallback data if there's an error or no data
  const ordersData = error || !DatosOrdenes.length ? fallbackOrders : DatosOrdenes;

  const OrdenesFiltradas = ordersData.filter((orden) => {
    const matchesSearch = (
      orden.Cliente.toLowerCase().includes(BuscaTermino.toLowerCase()) ||
      orden.OrderID.toString().includes(BuscaTermino) ||
      orden.EstadoPago.toLowerCase().includes(BuscaTermino.toLowerCase()) ||
      orden.EstadoOrden.toLowerCase().includes(BuscaTermino.toLowerCase()) ||
      orden.TipoEnvio.toLowerCase().includes(BuscaTermino.toLowerCase()) ||
      orden.Fecha.toLowerCase().includes(BuscaTermino.toLowerCase()) ||
      (orden.TrackingNumber && orden.TrackingNumber.toLowerCase().includes(BuscaTermino.toLowerCase()))
    );

    const matchesPaymentFilter = selectedFilter === "all" ||
      (selectedFilter === "pendiente" && orden.EstadoPago.toLowerCase() === "pendiente") ||
      (selectedFilter === "completado" && orden.EstadoPago.toLowerCase() === "completado") ||
      (selectedFilter === "failed" && orden.EstadoPago.toLowerCase() === "failed") ||
      (selectedFilter === "refunded" && orden.EstadoPago.toLowerCase() === "refunded");

    const matchesFulfillmentFilter = selectedFulfillmentFilter === "all" ||
      (selectedFulfillmentFilter === "procesando" && orden.EstadoOrden.toLowerCase() === "procesando") ||
      (selectedFulfillmentFilter === "enviado" && orden.EstadoOrden.toLowerCase() === "enviado") ||
      (selectedFulfillmentFilter === "entregado" && orden.EstadoOrden.toLowerCase() === "entregado") ||
      (selectedFulfillmentFilter === "cancelado" && orden.EstadoOrden.toLowerCase() === "cancelado");

    return matchesSearch && matchesPaymentFilter && matchesFulfillmentFilter;
  });

  const getFilterCount = (filter) => {
    if (filter === "all") return ordersData.length;
    return ordersData.filter(orden => orden.EstadoPago.toLowerCase() === filter).length;
  };

  const getFulfillmentFilterCount = (filter) => {
    if (filter === "all") return ordersData.length;
    return ordersData.filter(orden => orden.EstadoOrden.toLowerCase() === filter).length;
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'entregado':
      case 'completado':
      case 'pagado':
        return <BsCheckCircle className="me-1" />;
      case 'procesando':
      case 'pendiente':
        return <BsClock className="me-1" />;
      case 'enviado':
        return <BsTruck className="me-1" />;
      case 'failed':
      case 'cancelado':
        return <BsExclamationTriangle className="me-1" />;
      default:
        return null;
    }
  };

  const handleViewOrder = (orderId) => {
    alert(`Ver detalles de la orden ${shortenOrderId(orderId)}`);
  };

  const handleEditOrder = (orderId) => {
    alert(`Editar orden ${shortenOrderId(orderId)}`);
  };

  const handleDeleteOrder = (orderId) => {
    if (confirm(`¿Está seguro de que desea eliminar la orden ${shortenOrderId(orderId)}?`)) {
      alert(`Orden ${shortenOrderId(orderId)} eliminada`);
    }
  };

  const handleExport = () => {
    alert('Exportando órdenes... Esta funcionalidad estará disponible pronto.');
  };

  const handleAddOrder = () => {
    alert('Agregar nueva orden... Esta funcionalidad estará disponible pronto.');
  };

  if (isLoading) {
    return (
      <div className="envios-dashboard">
        <div className="container-fluid p-4">
          <BreadCrumb items={items} activeItem={"Envíos"} />

          {/* Header Card */}
          <div className="envios-card mt-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="card-section-title mb-2">
                    <BsTruck className="section-icon" />
                    Gestión de Envíos y Órdenes
                  </h2>
                  <p className="text-muted mb-0">
                    Administre todas las órdenes y su estado de envío
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando órdenes...</span>
            </div>
            <p className="mt-3 text-muted">Cargando órdenes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="envios-dashboard">
        <div className="container-fluid p-4">
          <BreadCrumb items={items} activeItem={"Envíos"} />

          {/* Header Card */}
          <div className="envios-card mt-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h2 className="card-section-title mb-2">
                    <BsTruck className="section-icon" />
                    Gestión de Envíos y Órdenes
                  </h2>
                  <p className="text-muted mb-0">
                    Administre todas las órdenes y su estado de envío
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="alert alert-warning mt-4 d-flex align-items-center">
            <BsExclamationTriangle className="me-2" />
            <div>
              <strong>Error al cargar órdenes:</strong> {error.message || "Error desconocido"}
              <br />
              <small className="text-muted">Mostrando datos de ejemplo.
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
    <div className="envios-dashboard">
      <div className="container-fluid p-4">
        <BreadCrumb items={items} activeItem={"Envíos"} />

        {/* Header Card */}
        <div className="envios-card mt-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="card-section-title mb-2">
                  <BsTruck className="section-icon" />
                  Gestión de Envíos y Órdenes
                </h2>
                <p className="text-muted mb-0">
                  Administre todas las órdenes y su estado de envío
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="status-badge status-active">
                  {OrdenesFiltradas.length} Orden{OrdenesFiltradas.length !== 1 ? 'es' : ''}
                </span>
                <span className="status-badge status-info">
                  {ordersData.filter(o => o.EstadoOrden.toLowerCase() === 'enviado').length} Enviada{ordersData.filter(o => o.EstadoOrden.toLowerCase() === 'enviado').length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="envios-card">
          <div className="card-body">
            <div className="row align-items-center mb-3">
              <div className="col-md-8">
                <h3 className="card-section-title">
                  <BsFilter className="section-icon" />
                  Filtros de Órdenes
                </h3>

                {/* Payment Status Filters */}
                <div className="mb-3">
                  <h6 className="text-muted mb-2">Estado de Pago</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className={`btn btn-sm ${selectedFilter === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => handleFilterChange("all")}
                    >
                      Todos ({getFilterCount("all")})
                    </button>
                    <button
                      className={`btn btn-sm ${selectedFilter === "pendiente" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => handleFilterChange("pendiente")}
                    >
                      Pendiente ({getFilterCount("pendiente")})
                    </button>
                    <button
                      className={`btn btn-sm ${selectedFilter === "completado" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => handleFilterChange("completado")}
                    >
                      Completado ({getFilterCount("completado")})
                    </button>
                    <button
                      className={`btn btn-sm ${selectedFilter === "failed" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => handleFilterChange("failed")}
                    >
                      Fallido ({getFilterCount("failed")})
                    </button>
                  </div>
                </div>

                {/* Fulfillment Status Filters */}
                <div>
                  <h6 className="text-muted mb-2">Estado de Envío</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className={`btn btn-sm ${selectedFulfillmentFilter === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => handleFulfillmentFilterChange("all")}
                    >
                      Todos ({getFulfillmentFilterCount("all")})
                    </button>
                    <button
                      className={`btn btn-sm ${selectedFulfillmentFilter === "procesando" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => handleFulfillmentFilterChange("procesando")}
                    >
                      Procesando ({getFulfillmentFilterCount("procesando")})
                    </button>
                    <button
                      className={`btn btn-sm ${selectedFulfillmentFilter === "enviado" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => handleFulfillmentFilterChange("enviado")}
                    >
                      Enviado ({getFulfillmentFilterCount("enviado")})
                    </button>
                    <button
                      className={`btn btn-sm ${selectedFulfillmentFilter === "entregado" ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => handleFulfillmentFilterChange("entregado")}
                    >
                      Entregado ({getFulfillmentFilterCount("entregado")})
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Buscar órdenes..."
                    className="form-control search-input"
                    value={BuscaTermino}
                    onChange={handleCambioBusqueda}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button className="modern-btn btn-secondary" onClick={handleExport}>
                <BsDownload />
                Exportar
              </button>
              <button className="modern-btn btn-primary-modern" onClick={handleAddOrder}>
                <BsPlus />
                Agregar Orden
              </button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="envios-card">
          <div className="card-body p-0">
            <div className="p-4 border-bottom">
              <h3 className="card-section-title mb-0">
                <BsShop className="section-icon" />
                Órdenes de Envío
              </h3>
            </div>

            <div className="table-responsive">
              <table className="modern-table orders-table">
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" className="form-check-input" />
                    </th>
                    <th>Orden</th>
                    <th>Total</th>
                    <th>Cliente</th>
                    <th>Estado del Pago</th>
                    <th>Estado de Envío</th>
                    <th>Tipo de Entrega</th>
                    <th>Tracking</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {OrdenesFiltradas.length > 0 ? (
                    OrdenesFiltradas.map((Orden) => (
                      <tr key={Orden.OrderID}>
                        <td>
                          <input type="checkbox" className="form-check-input" />
                        </td>
                        <td>
                          <span
                            title={`Full ID: ${Orden.OrderID}`}
                            className="fw-bold text-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleViewOrder(Orden.OrderID)}
                          >
                            {shortenOrderId(Orden.OrderID)}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold">${Orden.Total}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="user-avatar me-2">
                              {Orden.Cliente.charAt(0).toUpperCase()}
                            </div>
                            {Orden.Cliente}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge status-${Orden.EstadoPago.toLowerCase().replace(" ", "-")}`}
                          >
                            {getStatusIcon(Orden.EstadoPago)}
                            {Orden.EstadoPago.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge status-${Orden.EstadoOrden.toLowerCase().replace(" ", "-")}`}
                          >
                            {getStatusIcon(Orden.EstadoOrden)}
                            {Orden.EstadoOrden.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className="delivery-type">
                            {Orden.TipoEnvio}
                          </span>
                        </td>
                        <td>
                          {Orden.TrackingNumber ? (
                            <code className="tracking-number">
                              {Orden.TrackingNumber}
                            </code>
                          ) : (
                            <span className="text-muted">Sin tracking</span>
                          )}
                        </td>
                        <td className="text-muted">
                          {new Date(Orden.Fecha).toLocaleDateString('es-MX')}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="action-btn btn-view"
                              onClick={() => handleViewOrder(Orden.OrderID)}
                              title="Ver detalles"
                            >
                              <BsEye />
                            </button>
                            <button
                              className="action-btn btn-edit"
                              onClick={() => handleEditOrder(Orden.OrderID)}
                              title="Editar orden"
                            >
                              <BsPencilSquare />
                            </button>
                            <button
                              className="action-btn btn-delete"
                              onClick={() => handleDeleteOrder(Orden.OrderID)}
                              title="Eliminar orden"
                            >
                              <BsTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="10" className="text-center py-5">
                        <div className="text-muted">
                          <BsTruck size={48} className="mb-3 opacity-50" />
                          <h5>No se encontraron órdenes</h5>
                          <p className="mb-0">
                            {BuscaTermino || selectedFilter !== "all" || selectedFulfillmentFilter !== "all"
                              ? 'No hay órdenes que coincidan con los filtros aplicados'
                              : 'No hay órdenes registradas'
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ordenes;
