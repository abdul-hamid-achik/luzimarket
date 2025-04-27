import { Link } from "react-router-dom";
import "@/css/sidebar.css";
import "bootstrap/dist/css/bootstrap.min.css";

const Sidebar = () => {

  return (
    <div className="sidebar col-md">
      <div className="d-flex flex-nowrap">
        <div className="d-flex flex-column flex-shrink-0 p-3 bg-body-tertiary">
          <ul className="nav nav-pills flex-column mb-auto">
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
              <Link to="/inicio/ventas" className="nav-link link-body-emphasis">
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
  );
};

export default Sidebar;
