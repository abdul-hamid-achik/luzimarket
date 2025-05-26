import React, { useState } from 'react';
import BreadCrumb from "@/components/breadcrumb";
import SelectCiudades from "@/pages/empleados/components/select_estados_ciudades";
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
  BsInfoCircle
} from "react-icons/bs";
import './horarios.css';

const Horarios = () => {
  const [tiendas, setTiendas] = useState([
    {
      id: 1,
      nombre: "Tienda Uno",
      horarioApertura: "09:00",
      horarioCierre: "19:00",
      estado: "Aguascalientes",
      ciudad: "Aguascalientes",
      activa: true
    },
    {
      id: 2,
      nombre: "Tienda Dos",
      horarioApertura: "09:00",
      horarioCierre: "18:30",
      estado: "Ciudad de México",
      ciudad: "Coyoacán",
      activa: true
    }
  ]);

  const [editingStore, setEditingStore] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({ estado: '', ciudad: '' });
  const [isSaving, setIsSaving] = useState(false);

  const items = [{ name: "Horarios", link: "/dashboard/horarios" }];

  const handleEditStore = (store) => {
    setEditingStore({ ...store });
    setIsEditModalOpen(true);
  };

  const handleDeleteStore = (store) => {
    setStoreToDelete(store);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTiendas(prev => prev.filter(t => t.id !== storeToDelete.id));
      setIsDeleteModalOpen(false);
      setStoreToDelete(null);
    } catch (error) {
      console.error('Error deleting store:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingStore.nombre || !editingStore.horarioApertura || !editingStore.horarioCierre) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTiendas(prev => prev.map(t =>
        t.id === editingStore.id ? editingStore : t
      ));
      setIsEditModalOpen(false);
      setEditingStore(null);
    } catch (error) {
      console.error('Error saving store:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStore = async () => {
    const newStore = {
      id: Date.now(),
      nombre: `Nueva Tienda ${tiendas.length + 1}`,
      horarioApertura: "09:00",
      horarioCierre: "18:00",
      estado: selectedLocation.estado,
      ciudad: selectedLocation.ciudad,
      activa: true
    };

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTiendas(prev => [...prev, newStore]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding store:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateAllSchedules = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Horarios actualizados exitosamente');
    } catch (error) {
      console.error('Error updating schedules:', error);
      alert('Error al actualizar horarios');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTiendas = selectedLocation.estado && selectedLocation.ciudad
    ? tiendas.filter(t => t.estado === selectedLocation.estado && t.ciudad === selectedLocation.ciudad)
    : tiendas;

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
                  Gestión de Horarios
                </h2>
                <p className="text-muted mb-0">
                  Administre los horarios de apertura y cierre de las tiendas
                </p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="status-badge status-active">
                  {filteredTiendas.length} Tienda{filteredTiendas.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location Filter */}
        <div className="horarios-card">
          <div className="card-body">
            <h3 className="card-section-title">
              <BsGeoAlt className="section-icon" />
              Filtrar por Ubicación
            </h3>
            <SelectCiudades onLocationChange={setSelectedLocation} />

            {selectedLocation.estado && selectedLocation.ciudad && (
              <div className="mt-3">
                <div className="d-flex align-items-center gap-2">
                  <BsInfoCircle className="text-info" />
                  <small className="text-muted">
                    Mostrando tiendas en {selectedLocation.ciudad}, {selectedLocation.estado}
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stores Table */}
        <div className="horarios-card">
          <div className="card-body p-0">
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
              <h3 className="card-section-title mb-0">
                <BsShop className="section-icon" />
                Tiendas y Horarios
              </h3>
              <button
                className="modern-btn btn-primary-modern"
                onClick={() => setIsAddModalOpen(true)}
              >
                <BsPlus />
                Agregar Tienda
              </button>
            </div>

            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Tienda</th>
                    <th>Ubicación</th>
                    <th>Hora de Apertura</th>
                    <th>Hora de Cierre</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTiendas.length > 0 ? (
                    filteredTiendas.map((tienda) => (
                      <tr key={tienda.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <BsShop className="text-muted me-2" />
                            <strong>{tienda.nombre}</strong>
                          </div>
                        </td>
                        <td className="text-muted">
                          {tienda.ciudad}, {tienda.estado}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <BsClock className="text-muted me-2" />
                            {tienda.horarioApertura}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <BsClock className="text-muted me-2" />
                            {tienda.horarioCierre}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${tienda.activa ? 'status-active' : 'status-inactive'}`}>
                            {tienda.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="action-btn btn-edit"
                              onClick={() => handleEditStore(tienda)}
                              title="Editar horarios"
                            >
                              <BsPencilSquare />
                            </button>
                            <button
                              className="action-btn btn-delete"
                              onClick={() => handleDeleteStore(tienda)}
                              title="Eliminar tienda"
                            >
                              <BsTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="text-muted">
                          <BsShop size={48} className="mb-3 opacity-50" />
                          <h5>No hay tiendas</h5>
                          <p className="mb-0">
                            {selectedLocation.estado
                              ? 'No se encontraron tiendas en la ubicación seleccionada'
                              : 'No hay tiendas registradas'
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

        {/* Update Button */}
        <div className="action-buttons-container">
          <button
            className="modern-btn btn-primary-modern"
            onClick={updateAllSchedules}
            disabled={isSaving || filteredTiendas.length === 0}
          >
            {isSaving ? <div className="loading-spinner" /> : <BsCheck2Circle />}
            Actualizar Horarios
          </button>
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Editar Horarios de Tienda"
          size="md"
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
                Guardar Cambios
              </button>
            </div>
          }
        >
          {editingStore && (
            <div>
              <div className="mb-3">
                <label className="form-label">Nombre de la Tienda</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingStore.nombre}
                  onChange={(e) => setEditingStore(prev => ({
                    ...prev,
                    nombre: e.target.value
                  }))}
                />
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Hora de Apertura</label>
                  <input
                    type="time"
                    className="form-control"
                    value={editingStore.horarioApertura}
                    onChange={(e) => setEditingStore(prev => ({
                      ...prev,
                      horarioApertura: e.target.value
                    }))}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">Hora de Cierre</label>
                  <input
                    type="time"
                    className="form-control"
                    value={editingStore.horarioCierre}
                    onChange={(e) => setEditingStore(prev => ({
                      ...prev,
                      horarioCierre: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={editingStore.activa}
                    onChange={(e) => setEditingStore(prev => ({
                      ...prev,
                      activa: e.target.checked
                    }))}
                    id="activaCheck"
                  />
                  <label className="form-check-label" htmlFor="activaCheck">
                    Tienda activa
                  </label>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Eliminar Tienda"
          message={`¿Está seguro de que desea eliminar la tienda "${storeToDelete?.nombre}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          isLoading={isSaving}
        />

        {/* Add Store Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Agregar Nueva Tienda"
          size="md"
          footer={
            <div className="d-flex gap-2 justify-content-end">
              <button
                className="btn btn-secondary"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddStore}
                disabled={isSaving || !selectedLocation.estado || !selectedLocation.ciudad}
              >
                {isSaving ? <div className="spinner-border spinner-border-sm me-2" /> : null}
                Agregar Tienda
              </button>
            </div>
          }
        >
          <div className="text-center py-4">
            <BsShop size={48} className="text-muted mb-3" />
            <h5>Agregar Nueva Tienda</h5>
            <p className="text-muted">
              {selectedLocation.estado && selectedLocation.ciudad
                ? `Se agregará una nueva tienda en ${selectedLocation.ciudad}, ${selectedLocation.estado}`
                : 'Por favor seleccione una ubicación primero'
              }
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Horarios;
