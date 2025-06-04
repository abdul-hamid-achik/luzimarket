import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Sidebar = () => {
  const location = useLocation();

  // Function to check if a link is active
  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="sidebar">
      <div className="d-flex flex-column flex-shrink-0 p-3 bg-body-tertiary">
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-3">
            <Link
              to="/dashboard"
              className={`nav-link link-body-emphasis ${isActive("/dashboard") ? "active" : ""}`}
            >
              Dashboard
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link
              to="/dashboard/alertas"
              className={`nav-link link-body-emphasis ${isActive("/dashboard/alertas") ? "active" : ""}`}
            >
              Alertas
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link
              to="/dashboard/productos"
              className={`nav-link link-body-emphasis ${isActive("/dashboard/productos") ? "active" : ""}`}
            >
              Productos
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link
              to="/dashboard/categorias"
              className={`nav-link link-body-emphasis ${isActive("/dashboard/categorias") ? "active" : ""}`}
            >
              Categorías
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link
              to="/dashboard/envios"
              className={`nav-link link-body-emphasis ${isActive("/dashboard/envios") ? "active" : ""}`}
            >
              Envíos
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link
              to="/dashboard/dinero"
              className={`nav-link link-body-emphasis ${isActive("/dashboard/dinero") ? "active" : ""}`}
            >
              Dinero
            </Link>
          </li>
          <li className="nav-item mb-3">
            <Link
              to="/dashboard/horarios"
              className={`nav-link link-body-emphasis ${isActive("/dashboard/horarios") ? "active" : ""}`}
            >
              Horarios
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
