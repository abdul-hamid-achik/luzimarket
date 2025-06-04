import React, { useState, useEffect } from 'react';
import BreadCrumb from "@/components/breadcrumb";
import { useDeliveryZones } from "@/api/hooks";
import Modal, { ConfirmationModal } from "@/pages/empleados/components/modal";
import {
  BsClock,
  BsCalendar,
  BsGeoAlt,
  BsPencilSquare,
  BsTrash,
  BsPlus,
  BsShop,
  BsCheck2Circle,
  BsInfoCircle,
  BsExclamationTriangle,
  BsCheckCircle
} from "react-icons/bs";
import './horarios.css';

const Horarios = () => {
  const { data: deliveryZones = [], isLoading, error } = useDeliveryZones();
  const [schedules, setSchedules] = useState({});
  const [editingZone, setEditingZone] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedState, setSelectedState] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const items = [
    { name: "Dashboard", link: "/dashboard" },
    { name: "Horarios", link: "/dashboard/horarios" }
  ];

  // Initialize schedules for delivery zones
  useEffect(() => {
    if (deliveryZones.length > 0) {
      const initialSchedules = {};
      deliveryZones.forEach(zone => {
        if (!schedules[zone.id]) {
          initialSchedules[zone.id] = {
            id: zone.id,
            name: zone.name,
            fee: zone.fee,
            isActive: zone.isActive,
            schedule: {
              monday: { open: '09:00', close: '18:00', enabled: true },
              tuesday: { open: '09:00', close: '18:00', enabled: true },
              wednesday: { open: '09:00', close: '18:00', enabled: true },
              thursday: { open: '09:00', close: '18:00', enabled: true },
              friday: { open: '09:00', close: '18:00', enabled: true },
              saturday: { open: '09:00', close: '16:00', enabled: true },
              sunday: { open: '10:00', close: '15:00', enabled: false }
            },
            specialHours: [],
            lastUpdated: new Date().toISOString()
          };
        }
      });
      setSchedules(prev => ({ ...prev, ...initialSchedules }));
    }
  }, [deliveryZones]);

  const handleEditZone = (zone) => {
    const zoneSchedule = schedules[zone.id] || {
      id: zone.id,
      name: zone.name,
      fee: zone.fee,
      isActive: zone.isActive,
      schedule: {
        monday: { open: '09:00', close: '18:00', enabled: true },
        tuesday: { open: '09:00', close: '18:00', enabled: true },
        wednesday: { open: '09:00', close: '18:00', enabled: true },
        thursday: { open: '09:00', close: '18:00', enabled: true },
        friday: { open: '09:00', close: '18:00', enabled: true },
        saturday: { open: '09:00', close: '16:00', enabled: true },
        sunday: { open: '10:00', close: '15:00', enabled: false }
      },
      specialHours: [],
      lastUpdated: new Date().toISOString()
    };
    setEditingZone({ ...zoneSchedule });
    setIsEditModalOpen(true);
  };

  const handleDeleteZone = (zone) => {
    setZoneToDelete(zone);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to disable delivery zone
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, this would call an API to disable the zone
      const updatedSchedules = { ...schedules };
      if (updatedSchedules[zoneToDelete.id]) {
        updatedSchedules[zoneToDelete.id].isActive = false;
      }
      setSchedules(updatedSchedules);

      setIsDeleteModalOpen(false);
      setZoneToDelete(null);
    } catch (error) {
      console.error('Error disabling delivery zone:', error);
      alert('Error al desactivar zona de entrega');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingZone.name) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call to update delivery zone schedule
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedSchedule = {
        ...editingZone,
        lastUpdated: new Date().toISOString()
      };

      setSchedules(prev => ({
        ...prev,
        [editingZone.id]: updatedSchedule
      }));

      setIsEditModalOpen(false);
      setEditingZone(null);
    } catch (error) {
      console.error('Error saving delivery zone schedule:', error);
      alert('Error al guardar horarios');
    } finally {
      setIsSaving(false);
    }
  };

  const updateAllSchedules = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to bulk update schedules
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update all schedules with current timestamp
      const updatedSchedules = {};
      Object.keys(schedules).forEach(zoneId => {
        updatedSchedules[zoneId] = {
          ...schedules[zoneId],
          lastUpdated: new Date().toISOString()
        };
      });
      setSchedules(updatedSchedules);

      alert('Horarios de entrega actualizados exitosamente');
    } catch (error) {
      console.error('Error updating schedules:', error);
      alert('Error al actualizar horarios');
    } finally {
      setIsSaving(false);
    }
  };

  const getStateFromZoneName = (zoneName) => {
    if (zoneName.toLowerCase().includes('cdmx') || zoneName.toLowerCase().includes('ciudad de méxico')) return 'CDMX';
    if (zoneName.toLowerCase().includes('monterrey') || zoneName.toLowerCase().includes('nuevo león')) return 'Nuevo León';
    if (zoneName.toLowerCase().includes('guadalajara') || zoneName.toLowerCase().includes('jalisco')) return 'Jalisco';
    if (zoneName.toLowerCase().includes('torreón') || zoneName.toLowerCase().includes('coahuila')) return 'Coahuila';
    if (zoneName.toLowerCase().includes('durango')) return 'Durango';
    return 'Otro';
  };

  const filteredZones = deliveryZones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = selectedState === 'all' || getStateFromZoneName(zone.name) === selectedState;
    return matchesSearch && matchesState;
  });

  const getScheduleStatus = (zoneId) => {
    const schedule = schedules[zoneId];
    if (!schedule) return { status: 'not-configured', text: 'Sin configurar' };

    const enabledDays = Object.values(schedule.schedule).filter(day => day.enabled).length;
    if (enabledDays === 0) return { status: 'inactive', text: 'Inactivo' };
    if (enabledDays === 7) return { status: 'full-time', text: 'Tiempo completo' };
    return { status: 'partial', text: `${enabledDays} días` };
  };

  const formatSchedulePreview = (zoneId) => {
    const schedule = schedules[zoneId];
    if (!schedule) return 'Sin horarios configurados';

    const enabledDays = Object.entries(schedule.schedule)
      .filter(([_, day]) => day.enabled)
      .map(([dayName, day]) => `${dayName.charAt(0).toUpperCase()}: ${day.open}-${day.close}`);

    if (enabledDays.length === 0) return 'Sin días activos';
    if (enabledDays.length <= 2) return enabledDays.join(', ');
    return `${enabledDays.slice(0, 2).join(', ')}...`;
  };

  const states = ['all', 'CDMX', 'Nuevo León', 'Jalisco', 'Coahuila', 'Durango', 'Otro'];

  if (isLoading) {
    return (
      <div className="horarios-dashboard">
        <div className="container-fluid p-4">
          <BreadCrumb items={items} activeItem={"Horarios"} />
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando zonas de entrega...</span>
            </div>
            <p className="mt-3 text-muted">Cargando zonas de entrega...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="horarios-dashboard">
        <div className="container-fluid p-4">
          <BreadCrumb items={items} activeItem={"Horarios"} />
          <div className="alert alert-danger mt-4">
            <BsExclamationTriangle className="me-2" />
            Error al cargar las zonas de entrega: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="horarios-dashboard">
      <div className="container-fluid p-4">
        <BreadCrumb items={items} activeItem={"Horarios"} />

        {/* Header Card */}
        <div className="horarios-card mt-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="card-section-title mb-2">
                  <BsClock className="section-icon" />
                  Gestión de Horarios de Entrega
                </h2>
                <p className="text-muted mb-0">
                  Administre los horarios de entrega para cada zona de cobertura
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="status-badge status-active">
                  {filteredZones.length} Zona{filteredZones.length !== 1 ? 's' : ''}
                </span>
                <span className="status-badge status-info">
                  {deliveryZones.filter(z => z.isActive).length} Activa{deliveryZones.filter(z => z.isActive).length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="horarios-card">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-6">
                <h3 className="card-section-title">
                  <BsGeoAlt className="section-icon" />
                  Filtrar Zonas
                </h3>
                <div className="d-flex gap-2 flex-wrap">
                  {states.map(state => (
                    <button
                      key={state}
                      className={`btn btn-sm ${selectedState === state ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setSelectedState(state)}
                    >
                      {state === 'all' ? 'Todas' : state}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-md-6">
                <div className="search-container">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar zona de entrega..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Zones Table */}
        <div className="horarios-card">
          <div className="card-body p-0">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
              <h3 className="card-section-title mb-0">
                <BsShop className="section-icon" />
                Zonas de Entrega y Horarios
              </h3>
              <button
                className="modern-btn btn-primary-modern"
                onClick={updateAllSchedules}
                disabled={isSaving || filteredZones.length === 0}
              >
                {isSaving ? <div className="loading-spinner" /> : <BsCheck2Circle />}
                Actualizar Todos los Horarios
              </button>
            </div>

            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Zona de Entrega</th>
                    <th>Estado</th>
                    <th>Tarifa de Envío</th>
                    <th>Estado del Servicio</th>
                    <th>Horarios Configurados</th>
                    <th>Última Actualización</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredZones.length > 0 ? (
                    filteredZones.map((zone) => {
                      const scheduleStatus = getScheduleStatus(zone.id);
                      const schedule = schedules[zone.id];

                      return (
                        <tr key={zone.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <BsGeoAlt className="text-muted me-2" />
                              <div>
                                <strong>{zone.name}</strong>
                                {zone.description && (
                                  <div className="text-muted small">{zone.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-muted">
                            {getStateFromZoneName(zone.name)}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="fw-bold">${(zone.fee / 100).toFixed(2)}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${zone.isActive ? 'status-active' : 'status-inactive'}`}>
                              {zone.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td>
                            <div>
                              <span className={`status-badge status-${scheduleStatus.status}`}>
                                {scheduleStatus.text}
                              </span>
                              <div className="text-muted small mt-1">
                                {formatSchedulePreview(zone.id)}
                              </div>
                            </div>
                          </td>
                          <td className="text-muted small">
                            {schedule?.lastUpdated
                              ? new Date(schedule.lastUpdated).toLocaleDateString('es-MX')
                              : 'Sin configurar'
                            }
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="action-btn btn-edit"
                                onClick={() => handleEditZone(zone)}
                                title="Editar horarios"
                              >
                                <BsPencilSquare />
                              </button>
                              <button
                                className="action-btn btn-delete"
                                onClick={() => handleDeleteZone(zone)}
                                title="Desactivar zona"
                                disabled={!zone.isActive}
                              >
                                <BsTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div className="text-muted">
                          <BsGeoAlt size={48} className="mb-3 opacity-50" />
                          <h5>No hay zonas de entrega</h5>
                          <p className="mb-0">
                            {searchTerm || selectedState !== 'all'
                              ? 'No se encontraron zonas que coincidan con los filtros'
                              : 'No hay zonas de entrega configuradas'
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

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Configurar Horarios de Entrega"
          size="lg"
          footer={
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? <div className="spinner-border spinner-border-sm me-2" /> : null}
                Guardar Horarios
              </button>
            </div>
          }
        >
          {editingZone && (
            <div>
              <div className="mb-4">
                <h5 className="d-flex align-items-center">
                  <BsGeoAlt className="me-2" />
                  {editingZone.name}
                </h5>
                <p className="text-muted mb-0">
                  Tarifa de envío: ${(editingZone.fee / 100).toFixed(2)}
                </p>
              </div>

              <div className="mb-4">
                <h6>Horarios por Día de la Semana</h6>
                {Object.entries(editingZone.schedule).map(([day, schedule]) => (
                  <div key={day} className="row align-items-center mb-3 p-3 border rounded">
                    <div className="col-md-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={(e) => setEditingZone(prev => ({
                            ...prev,
                            schedule: {
                              ...prev.schedule,
                              [day]: { ...schedule, enabled: e.target.checked }
                            }
                          }))}
                          id={`${day}-enabled`}
                        />
                        <label className="form-check-label fw-bold" htmlFor={`${day}-enabled`}>
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </label>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Apertura</label>
                      <input
                        type="time"
                        className="form-control"
                        value={schedule.open}
                        onChange={(e) => setEditingZone(prev => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule,
                            [day]: { ...schedule, open: e.target.value }
                          }
                        }))}
                        disabled={!schedule.enabled}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small">Cierre</label>
                      <input
                        type="time"
                        className="form-control"
                        value={schedule.close}
                        onChange={(e) => setEditingZone(prev => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule,
                            [day]: { ...schedule, close: e.target.value }
                          }
                        }))}
                        disabled={!schedule.enabled}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="alert alert-info">
                <BsInfoCircle className="me-2" />
                Los horarios configurados determinarán cuándo los clientes pueden realizar pedidos para entrega en esta zona.
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Desactivar Zona de Entrega"
          message={`¿Está seguro de que desea desactivar la zona de entrega "${zoneToDelete?.name}"? Los clientes no podrán realizar pedidos en esta zona.`}
          confirmText="Desactivar"
          cancelText="Cancelar"
          variant="danger"
          isLoading={isSaving}
        />
      </div>
    </div>
  );
};

export default Horarios;
