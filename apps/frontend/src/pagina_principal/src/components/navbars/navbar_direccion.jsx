import React from "react";
import "../../css/Navbars.css"

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Button } from "@nextui-org/react";
import Select from "react-select";

//const [selectedOptions, setSelectedOptions] = useState();

  // Array of all options
  const optionList = [
    { value: "Monterrey", label: "MONTERREY" },
    { value: "Saltillo", label: "SALTILLO" },
    { value: "Torreon", label: "TORREON" }
  ];

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      background: '#fff',
      borderColor: '#fff',
      borderRadius: 0,
      minHeight: '2.5rem',
      height: '2.5rem',
      boxShadow: 'none',
    }),

    valueContainer: (provided, state) => ({
      ...provided,
      height: '2.5rem',
      padding: '0 6px'
    }),

    input: (provided, state) => ({
      ...provided,
      margin: '0px',
    }),
    indicatorSeparator: state => ({
      display: 'none',
    }),
    indicatorsContainer: (provided, state) => ({
      ...provided,
      height: '2.5rem',
    }),
  };

function BasicExample() {
  return (
    <Navbar expand="lg" id="NavbarDireccion" className="borderNavbar">
      <Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav"/>
        <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          <button className="widthBoton">ESP</button>
          <button className="widthBoton">MXN</button>
        </Nav>
          <Nav className="me-auto">
            <Nav.Item className="TextoCentrado">SELECCIONAR UBICACION DE ENTREGA</Nav.Item>
            {/*<NavDropdown title="ESTADO" id="basic-nav-dropdown" className="borderDropdownEstado">
              <NavDropdown.Item href="#action/3.1">MONTERREY</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">SALTILLO</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">TORREON</NavDropdown.Item>
              </NavDropdown>*/}
            {/*<NavDropdown title="CIUDAD" id="basic-nav-dropdown" className="borderDropdown">
              <NavDropdown.Item href="#action/3.1">MONTERREY</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.2">SALTILLO</NavDropdown.Item>
              <NavDropdown.Item href="#action/3.3">TORREON</NavDropdown.Item>
              </NavDropdown>*/}
            <div style={{width: '10rem'}}>
              <Select
              options={optionList}
              placeholder="ESTADO"
              styles={customStyles}
              />
            </div>
            <div style={{width: '10rem'}}>
              <Select
              options={optionList}
              placeholder="CIUDAD"
              styles={customStyles}
              />
            </div>
            
            <Button
            css={{borderRadius: '0px', background: '#000'}}>ACEPTAR</Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
export default BasicExample;



