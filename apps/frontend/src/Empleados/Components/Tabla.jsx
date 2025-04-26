import React from "react";
import { Dropdown } from "bootstrap";

const Tabla = () => {
  const datos = [
    {
      nombre: "Tienda Uno",
      HorarioApertura: "9:00 AM",
      HorarioCierre: "7:00 PM",
    },
    {
      nombre: "Tienda Dos",
      HorarioApertura: "9:00 AM",
      HorarioCierre: "6:30 PM",
    },
  ];
  return (
    <table className="table table-borderless p-5">
      <thead>
        <tr>
          <th className="text-secondary">Nombre</th>
          <th className="text-secondary">Hora de Apertura</th>
          <th className="text-secondary">Hora de Cierre</th>
          <th className="text-secondary">Acciones</th>
        </tr>
      </thead>
      {datos.map((dato, index) => (
        <tbody>
          <tr key={index}>
            <td>
              <input
                type="text"
                className="form-control p-3 rounded rounded-3 bg-body-tertiary"
                value={dato.nombre}
                readOnly
              />
            </td>
            <td>
              <input
                type="text"
                className="form-control p-3 rounded rounded-3 bg-body-tertiary"
                value={dato.HorarioApertura}
                readOnly
              />
            </td>
            <td>
              <input
                type="text"
                className="form-control p-3 rounded rounded-3 bg-body-tertiary"
                value={dato.HorarioCierre}
                readOnly
              />
            </td>
            <td>
              <div className="dropdown">
                <button
                  className="btn btn-primary p-3 w-100"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Editar
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <a className="dropdown-item" href="#">
                      Action
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Another action
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Something else here
                    </a>
                  </li>
                </ul>
              </div>
            </td>
          </tr>
        </tbody>
      ))}
    </table>
  );
};

export default Tabla;
