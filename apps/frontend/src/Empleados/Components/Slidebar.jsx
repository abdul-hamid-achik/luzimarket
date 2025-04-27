import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Sidebar = () => {
  return (
    <div className="sidebar overflow-hidden">
      <div className="d-flex flex-nowrap">
        <div className="d-flex flex-column flex-shrink-0 p-3 bg-body-tertiary">
          <ul className="nav nav-pills flex-column mb-auto">
            <li className="nav-item mb-3">
              <Link
                to="/InicioEmpleados/DashboardEmpleados"
                className="nav-link link-body-emphasis"
              >
                Dashboard
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link
                to="/InicioEmpleados/AlertasEmpleados"
                className="nav-link link-body-emphasis"
              >
                Alertas
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link to="#" className="nav-link link-body-emphasis">
                Productos
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link to="/InicioEmpleados/Ordenes" className="nav-link link-body-emphasis">
                Envíos
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link to="#" className="nav-link link-body-emphasis">
                Dinero
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link
                to="/InicioEmpleados/Horarios"
                className="nav-link link-body-emphasis"
              >
                Horarios
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
