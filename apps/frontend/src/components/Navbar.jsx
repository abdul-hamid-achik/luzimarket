import React from "react";
import Usuario from "../PaginaPrincipal/src/images/LogoUserLuziMarket.png";
import Logo from "../images/luzimarket-logo.png";
import bandera from "../images/bandera_MX.png";
import notificacion from "../images/notificacion.png";
import { Link } from "react-router-dom";
import "../css/Navbar.css";
/*import {
  Container,
  Nav,
  Navbar,
  NavDropdown,
  Row,
  Col,
  Dropdown,
  Image,
} from "react-bootstrap";*/

const NavbarAdmin = () => {
  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid connav">
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasSlide"
          aria-controls="offcanvasSlide"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <ul className="navbar-nav start col-md-3 d-none d-lg-block">
          <li className="nav-item dropdown">
            <a
              href="#"
              className="nav-link dropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <img
                src={Usuario}
                alt="Imagen del Usuario"
                className="img-usuario rounded-5"
              />
              <span className="ms-3">
                <strong>Rik Bracho</strong> (Admin)
              </span>
            </a>
            <ul className="dropdown-menu">
              <li>
                <Link className="dropdown-item" href="#">
                  Action
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href="#">
                  Another action
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href="#">
                  Something else here
                </Link>
              </li>
            </ul>
          </li>
        </ul>

        <ul className="navbar-nav center col-md-6">
          <Link className="navbar-brand" href="#">
            <img
              src={Logo}
              alt="Logo Empresa"
              className="img-fluid"
              width={300}
            />
          </Link>
        </ul>

        <ul className="navbar-nav end col-md-3 d-none d-lg-block">
          <a href="#">
            <img src={bandera} alt="Icono Bandera" width={25} />
          </a>
          <a href="#" className="ms-4">
            <img src={notificacion} alt="Icono Notificación" width={25} />
          </a>
        </ul>

        <div
          className="offcanvas offcanvas-start"
          tabIndex="-1"
          id="offcanvasSlide"
          aria-labelledby="offcanvasSlide"
        >
          <div className="offcanvas-header">
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>

          <div className="offcanvas-body">
            <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
              <li className="nav-item mb-3">
                <Link
                  to="/inicio/dashboard"
                  className="nav-link link-body-emphasis"
                >
                  Dashboard
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link
                  to="/inicio/peticiones"
                  className="nav-link link-body-emphasis"
                >
                  Peticiones
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link
                  to="/inicio/ventas"
                  className="nav-link link-body-emphasis"
                >
                  Ventas
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link
                  to="/inicio/categorias"
                  className="nav-link link-body-emphasis"
                >
                  Categorias
                </Link>
              </li>
              <li className="nav-item mb-3">
                <Link
                  to="/inicio/locaciones"
                  className="nav-link link-body-emphasis"
                >
                  Locaciones
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarAdmin;
