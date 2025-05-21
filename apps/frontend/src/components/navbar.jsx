import React from "react";
import Usuario from "@/assets/images/luzimarket_logo_empleado.png";
import Logo from "@/assets/images/luzimarket_logo.png";
import bandera from "@/assets/images/bandera_mx.png";
import notificacion from "@/assets/images/notificacion.png";
import { Link } from "react-router-dom";
import "@/css/navbar.css";
import { useAuth } from "@/context/auth_context";
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
  const { user, isAuthenticated, logout } = useAuth();

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
          <li className="nav-item">
            {isAuthenticated ? (
              <>
                <a
                  href="#"
                  className="nav-link dropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img src={Usuario} alt="Imagen del Usuario" className="img-usuario rounded-5" />
                  <span className="ms-3"><strong>{user.email}</strong> (Usuario)</span>
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to="/perfil">Perfil</Link>
                  </li>
                </ul>
              </>
            ) : (
              <div className="d-flex align-items-center">
                <strong className="me-2">Invitado</strong>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link ms-2">Register</Link>
              </div>
            )}
          </li>
        </ul>

        <ul className="navbar-nav center col-md-6">
          <Link className="navbar-brand" to="/">
            <img
              src={Logo}
              alt="Logo Empresa"
              className="img-fluid"
              width={300}
            />
          </Link>
        </ul>

        <ul className="navbar-nav end col-md-3 d-none d-lg-block">
          <Link to="/" tabIndex={-1} aria-label="Bandera">
            <img src={bandera} alt="Icono Bandera" width={25} />
          </Link>
          <Link to="/" className="ms-4" tabIndex={-1} aria-label="Notificación">
            <img src={notificacion} alt="Icono Notificación" width={25} />
          </Link>
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
