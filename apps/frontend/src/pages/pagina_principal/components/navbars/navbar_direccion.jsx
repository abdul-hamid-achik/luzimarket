import "@/pages/pagina_principal/css/navbars.css"

import React, { useState } from "react";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Button } from "@nextui-org/react";
import Select from "react-select";

// Array of all options
const optionList = [
  { value: "Monterrey", label: "MONTERREY" },
  { value: "Saltillo", label: "SALTILLO" },
  { value: "Torreon", label: "TORREON" }
];

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
  const [selectedEstado, setSelectedEstado] = useState(null);
  const [selectedCiudad, setSelectedCiudad] = useState(null);

  // No more unused _state variables in customStyles

  return (
    <Navbar expand="lg" id="NavbarDireccion" className="borderNavbar">
      <Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <button className="widthBoton">ESP</button>
            <button className="widthBoton">MXN</button>
          </Nav>
          <Nav className="me-auto">
            <Nav.Item className="TextoCentrado">SELECCIONAR UBICACION DE ENTREGA</Nav.Item>
            <div style={{ width: '10rem' }}>
              <Select
                options={optionList}
                placeholder="ESTADO"
                styles={customStyles}
                value={selectedEstado}
                onChange={setSelectedEstado}
              />
            </div>
            <div style={{ width: '10rem' }}>
              <Select
                options={optionList}
                placeholder="CIUDAD"
                styles={customStyles}
                value={selectedCiudad}
                onChange={setSelectedCiudad}
              />
            </div>
            <Button
              css={{ borderRadius: '0px', background: '#000' }}>ACEPTAR</Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
export default NavbarDireccion;
