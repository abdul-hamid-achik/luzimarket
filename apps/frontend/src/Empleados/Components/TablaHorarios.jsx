import React from "react";
//import { Dropdown } from "bootstrap";

const TablaHorarios = () => {
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
                className="form-control p-3 rounded-4 bg-body-tertiary"
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
                  className="btn btn-primary opacity-75 rounded-3 w-100 p-3"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Entrar
                  <i className="icon-link ms-3">↓</i>
                </button>
                <ul className="dropdown-menu">
                  <li>
                    <link to="#" />
                    <a className="dropdown-item">Aceptar</a>
                  </li>
                  <li>
                    <link to="#" />
                    <a className="dropdown-item">Editar</a>
                  </li>
                  <li>
                    <link to="#" />
                    <a className="dropdown-item">Borrar</a>
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

export default TablaHorarios;
