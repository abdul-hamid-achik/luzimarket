import "@/pages/inicio/css/navbars.css"

import React, { useState, useEffect } from "react";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Button, Alert, Spinner } from "react-bootstrap";
import Select from "react-select";
import { useStates, useDeliveryZones, useUpdateSessionDeliveryZone, useRestoreUserPreferences } from '@/api/hooks';
import { useAuth } from '@/context/auth_context';

const customStyles = {
  control: (provided) => ({
    ...provided,
    background: '#fff',
    borderColor: '#fff',
    borderRadius: 0,
    minHeight: '2.5rem',
    height: '2.5rem',
    boxShadow: 'none',
  }),

  valueContainer: (provided) => ({
    ...provided,
    height: '2.5rem',
    padding: '0 6px'
  }),

  input: (provided) => ({
    ...provided,
    margin: '0px',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: '2.5rem',
  }),
};

function NavbarDireccion() {
  const { user, isAuthenticated } = useAuth();

  // State declarations MUST come before any hooks that use them
  const [selectedEstado, setSelectedEstado] = useState(null);
  const [selectedCiudad, setSelectedCiudad] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Now hooks can safely reference the state variables
  const { data: states = [], isLoading: statesLoading } = useStates();
  const { data: deliveryZones = [], isLoading: zonesLoading } = useDeliveryZones(
    selectedEstado ? { state: selectedEstado.value, active: true } : { active: true }
  );
  const updateSessionDeliveryZone = useUpdateSessionDeliveryZone();
  const restorePreferences = useRestoreUserPreferences();

  // Transform states data to Select options
  const stateOptions = states.map(state => ({
    value: state.value,
    label: state.label.toUpperCase()
  }));

  // Transform delivery zones data to Select options
  const ciudadOptions = deliveryZones.map(zone => ({
    value: zone.id,
    label: zone.name.toUpperCase(),
    fee: zone.fee
  }));

  // Load saved selections from sessionStorage
  useEffect(() => {
    const savedState = sessionStorage.getItem('selectedDeliveryState');

    if (savedState && states.length > 0) {
      const stateOption = stateOptions.find(opt => opt.value === savedState);
      if (stateOption && !selectedEstado) {
        setSelectedEstado(stateOption);
      }
    }
  }, [states]);

  // Restore city selection after delivery zones are loaded for the selected state
  useEffect(() => {
    const savedZone = sessionStorage.getItem('selectedDeliveryZone');

    if (savedZone && deliveryZones.length > 0 && selectedEstado && !selectedCiudad) {
      const zoneOption = ciudadOptions.find(opt => opt.value === savedZone);
      if (zoneOption) {
        setSelectedCiudad(zoneOption);
        setIsCollapsed(true); // Show collapsed view when restoring complete selection
      } else {
        // Invalid delivery zone - clear it and show error
        console.warn('Invalid delivery zone found in storage:', savedZone);
        sessionStorage.removeItem('selectedDeliveryZone');
        setError('Delivery zone not found. Please select a valid location.');
        setIsCollapsed(false); // Ensure expanded view to allow re-selection
      }
    }
  }, [deliveryZones, selectedEstado]);

  const handleEstadoChange = (selectedOption) => {
    setSelectedEstado(selectedOption);
    setSelectedCiudad(null); // Reset city when state changes
    setError('');
    setSuccess('');

    if (selectedOption) {
      sessionStorage.setItem('selectedDeliveryState', selectedOption.value);
    } else {
      sessionStorage.removeItem('selectedDeliveryState');
    }
    sessionStorage.removeItem('selectedDeliveryZone');

    // The useDeliveryZones hook will automatically refetch with the new state
  };

  const handleCiudadChange = (selectedOption) => {
    setSelectedCiudad(selectedOption);
    setError('');

    if (selectedOption) {
      sessionStorage.setItem('selectedDeliveryZone', selectedOption.value);
    } else {
      sessionStorage.removeItem('selectedDeliveryZone');
    }
  };

  const handleAceptar = async () => {
    setError('');
    setSuccess('');

    if (!selectedEstado) {
      setError('Por favor selecciona un estado');
      return;
    }

    if (!selectedCiudad) {
      setError('Por favor selecciona una ciudad');
      return;
    }

    // Check if user has a valid session token
    if (!user?.sessionId) {
      setError('No hay sesión activa. Por favor recarga la página.');
      return;
    }

    try {
      await updateSessionDeliveryZone.mutateAsync({
        deliveryZoneId: selectedCiudad.value
      });

      const successMessage = isAuthenticated
        ? `Ubicación de entrega guardada: ${selectedCiudad.label}`
        : `Ubicación de entrega actualizada: ${selectedCiudad.label}`;

      setSuccess(successMessage);

      // Collapse the component after successful selection
      setIsCollapsed(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error updating delivery location:', err);
      setError(err.response?.data?.error || 'Error al actualizar la ubicación');
    }
  };

  const handleExpandToChange = () => {
    setIsCollapsed(false);
    setError('');
    setSuccess('');
  };

  const isLoading = statesLoading || zonesLoading || updateSessionDeliveryZone.isLoading;

  // Collapsed view when location is selected
  const renderCollapsedView = () => (
    <Nav className="me-auto">
      <Nav.Item className="TextoCentrado">
        <span style={{ marginRight: '10px' }}>
          📍 {selectedCiudad?.label}, {selectedEstado?.label}
        </span>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={handleExpandToChange}
          data-testid="change-location"
          style={{ borderRadius: '0px' }}
        >
          CAMBIAR
        </button>
      </Nav.Item>
    </Nav>
  );

  // Expanded view for selection
  const renderExpandedView = () => (
    <Nav className="me-auto">
      <Nav.Item className="TextoCentrado">SELECCIONAR UBICACION DE ENTREGA</Nav.Item>
      <div style={{ width: '10rem' }}>
        <Select
          options={stateOptions}
          placeholder="ESTADO"
          styles={customStyles}
          value={selectedEstado}
          onChange={handleEstadoChange}
          isLoading={statesLoading}
          isDisabled={isLoading}
          isClearable
          data-testid="estado-select"
          className="estado-select"
        />
      </div>
      <div style={{ width: '10rem' }}>
        <Select
          options={ciudadOptions}
          placeholder="CIUDAD"
          styles={customStyles}
          value={selectedCiudad}
          onChange={handleCiudadChange}
          isLoading={zonesLoading}
          isDisabled={isLoading || !selectedEstado}
          isClearable
          data-testid="ciudad-select"
          className="ciudad-select"
        />
      </div>
      <Button
        variant="dark"
        style={{ borderRadius: '0px' }}
        onClick={handleAceptar}
        disabled={isLoading || !selectedEstado || !selectedCiudad}
      >
        {updateSessionDeliveryZone.isLoading ? (
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
          />
        ) : (
          'ACEPTAR'
        )}
      </Button>
    </Nav>
  );

  return (
    <Navbar
      expand="lg"
      id="NavbarDireccion"
      className={`borderNavbar ${isCollapsed ? 'collapsed' : ''}`}
    >
      <Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <button className="widthBoton">ESP</button>
            <button className="widthBoton">MXN</button>
          </Nav>

          {/* Conditionally render collapsed or expanded view */}
          {isCollapsed && selectedCiudad && selectedEstado ?
            renderCollapsedView() :
            renderExpandedView()
          }

          {/* Error and Success Messages */}
          {(error || success) && (
            <Nav className="ms-auto">
              {error && (
                <Alert variant="danger" className="mb-0 py-1 px-2 small">
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success" className="mb-0 py-1 px-2 small">
                  {success}
                </Alert>
              )}
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarDireccion;
